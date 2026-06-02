<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Fixture\BracketSlotRepository;
use App\Domain\Fixture\Dto\BracketSlotPlan;
use App\Domain\Fixture\Dto\FixturePlan;
use App\Domain\Fixture\Dto\GroupInput;
use App\Domain\Fixture\Dto\Pairing;
use App\Domain\Fixture\Dto\RoundPlan;
use App\Domain\Fixture\FixtureGenerator;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Fixture\RoundRepository;
use App\Domain\Group\GroupRepository;
use App\Domain\GroupTeam\GroupTeamRepository;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Shared\Pagination;
use App\Domain\Stage\Stage;
use App\Domain\Team\TeamRepository;
use App\Domain\Tournament\Tournament;
use PDO;

/**
 * Transactional coordinator that turns a stage's configured teams into a full
 * fixture (rounds + matches, or a knockout bracket). Mirrors RegisterTeamService:
 * inject PDO + the pure FixtureGenerator + repositories, run everything in one
 * transaction.
 *
 * Idempotency guard: REFUSE-UNLESS-EMPTY. If the stage already has any rounds
 * (league/groups) or bracket slots (knockout), generation is refused with a 422
 * pointing at regenerate-fixtures. This keeps consolidated results safe.
 */
final class GenerateFixtureService
{
    public function __construct(
        private PDO $pdo,
        private FixtureGenerator $generator,
        private RoundRepository $rounds,
        private MatchRepository $matches,
        private BracketSlotRepository $bracketSlots,
        private GroupRepository $groups,
        private GroupTeamRepository $groupTeams,
        private TeamRepository $teams
    ) {
    }

    /**
     * @return array<string,mixed> summary { stage_id, type, rounds_created,
     *                            matches_created, bracket_slots_created }
     */
    public function execute(Tournament $tournament, Stage $stage): array
    {
        // Refuse-unless-empty guard.
        if ($this->rounds->findByStage($stage->id) !== []
            || $this->bracketSlots->findByStage($stage->id) !== []) {
            throw new ValidationException([
                'stage_id' => 'Ya existen fixtures para esta fase; usa regenerar en su lugar.',
            ]);
        }

        $legs = max(1, $stage->legs);

        if ($stage->type === 'knockout') {
            $plan = $this->buildKnockoutPlan($stage);
        } else {
            $plan = $this->buildRoundRobinPlan($tournament, $stage, $legs);
        }

        $this->pdo->beginTransaction();

        try {
            $summary = $stage->type === 'knockout'
                ? $this->persistKnockout($stage, $plan)
                : $this->persistRoundRobin($tournament, $stage, $plan);

            $this->pdo->commit();

            return $summary;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Build the league/groups plan. Each group (or the single league) becomes an
     * independent round-robin with globally contiguous round numbers.
     */
    private function buildRoundRobinPlan(Tournament $tournament, Stage $stage, int $legs): FixturePlan
    {
        $inputs = $this->groupInputs($tournament, $stage);

        $hasTeams = false;
        foreach ($inputs as $input) {
            if (count($input->teamIds) >= 2) {
                $hasTeams = true;
                break;
            }
        }

        if (!$hasTeams) {
            throw new ValidationException([
                'stage_id' => 'La fase no está lista: asigna al menos 2 equipos por grupo antes de generar.',
            ]);
        }

        return $this->generator->generate($stage->type, $inputs, $legs);
    }

    /**
     * @return array<int,GroupInput>
     */
    private function groupInputs(Tournament $tournament, Stage $stage): array
    {
        $groups = $this->groups->findByStage($stage->id);

        // "groups" stages MUST have groups; "league" stages may run as a single
        // implicit group over the tournament's approved teams.
        if ($groups === []) {
            if ($stage->type === 'groups') {
                throw new ValidationException([
                    'stage_id' => 'La fase de grupos no tiene grupos definidos.',
                ]);
            }

            $teamIds = $this->approvedTeamIds($tournament->id);

            return [new GroupInput(null, $teamIds)];
        }

        $inputs = [];
        foreach ($groups as $group) {
            $assignments = $this->groupTeams->findByGroup($group->id);
            $teamIds = array_map(
                static fn ($gt): int => $gt->tournamentTeamId,
                $assignments
            );
            $inputs[] = new GroupInput($group->id, $teamIds);
        }

        return $inputs;
    }

    /**
     * @return array<int,int>
     */
    private function approvedTeamIds(int $tournamentId): array
    {
        $pagination = new Pagination(1, 100);
        $teams = $this->teams->paginateByTournament(
            $tournamentId,
            $pagination,
            ['status' => 'approved']
        );

        return array_map(static fn ($t): int => $t->id, $teams);
    }

    private function buildKnockoutPlan(Stage $stage): FixturePlan
    {
        // Fixed-size bracket: build EXACTLY bracket_size placeholder entrants.
        // bracket_size values are powers of two (4/8/16/32/64/128) so
        // KnockoutBuilder accepts them. Participants may be unknown at creation
        // time, so each first-round source is a neutral 'seed:{n}' label that the
        // bracket renders as TBD until results/seedings are filled in.
        if ($stage->bracketSize !== null) {
            $entrants = [];
            for ($n = 1; $n <= $stage->bracketSize; $n++) {
                $entrants[] = sprintf('seed:%d', $n);
            }

            return $this->generator->generate('knockout', [], 1, $entrants);
        }

        // Legacy path (bracket_size null): knockout entrants must be declared as
        // bracket sources. We seed from the stage's group_teams of any feeder
        // groups (if present), otherwise from approved teams ordering. Sources
        // are opaque strings.
        $groups = $this->groups->findByStage($stage->id);
        $entrants = [];

        foreach ($groups as $group) {
            foreach ($this->groupTeams->findByGroup($group->id) as $gt) {
                $entrants[] = sprintf('team:%d', $gt->tournamentTeamId);
            }
        }

        if (count($entrants) < 2) {
            throw new ValidationException([
                'stage_id' => 'La fase de eliminación no tiene participantes definidos (mínimo 2, potencia de dos).',
            ]);
        }

        return $this->generator->generate('knockout', [], 1, $entrants);
    }

    /**
     * Persist rounds, then matches referencing the freshly-created round ids.
     *
     * @return array<string,mixed>
     */
    private function persistRoundRobin(Tournament $tournament, Stage $stage, FixturePlan $plan): array
    {
        $roundsCreated = 0;
        $matchesCreated = 0;

        foreach ($plan->rounds as $roundPlan) {
            /** @var RoundPlan $roundPlan */
            $round = $this->rounds->create([
                'stage_id' => $stage->id,
                'group_id' => $roundPlan->groupId,
                'number'   => $roundPlan->number,
                'name'     => $roundPlan->name,
                'status'   => 'pending',
            ]);
            $roundsCreated++;

            foreach ($roundPlan->matches() as $pairing) {
                /** @var Pairing $pairing */
                $this->matches->create([
                    'tournament_id' => $tournament->id,
                    'stage_id'      => $stage->id,
                    'group_id'      => $roundPlan->groupId,
                    'round_id'      => $round->id,
                    'home_team_id'  => $pairing->homeTeamId,
                    'away_team_id'  => $pairing->awayTeamId,
                    'status'        => 'scheduled',
                    'leg'           => $pairing->leg,
                ]);
                $matchesCreated++;
            }
        }

        return [
            'stage_id'              => $stage->id,
            'type'                  => $plan->type,
            'rounds_created'        => $roundsCreated,
            'matches_created'       => $matchesCreated,
            'bracket_slots_created' => 0,
        ];
    }

    /**
     * Persist bracket slots in two passes: insert all slots (ref -> id), then a
     * second pass resolving next_slot refs to real ids.
     *
     * @return array<string,mixed>
     */
    private function persistKnockout(Stage $stage, FixturePlan $plan): array
    {
        /** @var array<string,int> $refToId */
        $refToId = [];

        // Pass 1: insert slots without next_slot_id.
        foreach ($plan->bracketSlots as $slotPlan) {
            /** @var BracketSlotPlan $slotPlan */
            $slot = $this->bracketSlots->create([
                'stage_id'     => $stage->id,
                'round_number' => $slotPlan->roundNumber,
                'round_label'  => $slotPlan->roundLabel,
                'position'     => $slotPlan->position,
                'home_source'  => $slotPlan->homeSource,
                'away_source'  => $slotPlan->awaySource,
                'next_slot_id' => null,
            ]);
            $refToId[$slotPlan->ref] = $slot->id;
        }

        // Pass 2: resolve next_slot refs to real ids.
        foreach ($plan->bracketSlots as $slotPlan) {
            if ($slotPlan->nextSlotRef === null) {
                continue;
            }
            $nextId = $refToId[$slotPlan->nextSlotRef] ?? null;
            if ($nextId !== null) {
                $this->bracketSlots->update($refToId[$slotPlan->ref], [
                    'next_slot_id' => $nextId,
                ]);
            }
        }

        return [
            'stage_id'              => $stage->id,
            'type'                  => $plan->type,
            'rounds_created'        => 0,
            'matches_created'       => 0,
            'bracket_slots_created' => count($plan->bracketSlots),
        ];
    }
}
