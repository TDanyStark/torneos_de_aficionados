<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Fixture\Dto\ExistingMatch;
use App\Domain\Fixture\Dto\ExistingRound;
use App\Domain\Fixture\Dto\Pairing;
use App\Domain\Fixture\Dto\RegenerationPlan;
use App\Domain\Fixture\Dto\RoundPlan;
use App\Domain\Fixture\FixtureRegenerator;
use App\Domain\Fixture\Match_;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Fixture\Round;
use App\Domain\Fixture\RoundRepository;
use App\Domain\Group\GroupRepository;
use App\Domain\GroupTeam\GroupTeamRepository;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\Stage;
use App\Domain\Tournament\Tournament;
use PDO;

/**
 * Transactional coordinator for late-registration fixture regeneration.
 *
 * SAFETY CONTRACT (plan 07 §5): rounds before K and any consolidated
 * (live/paused/finished/walkover) match are NEVER deleted or altered. Only the
 * UNPLAYED future portion is removed and recomputed to include the late team.
 *
 * The pure FixtureRegenerator decides WHAT to preserve/remove; this service only
 * executes the resulting plan inside one transaction.
 */
final class RegenerateFixtureService
{
    public function __construct(
        private PDO $pdo,
        private FixtureRegenerator $regenerator,
        private RoundRepository $rounds,
        private MatchRepository $matches,
        private GroupRepository $groups,
        private GroupTeamRepository $groupTeams,
        private RegistrationRepository $registrations
    ) {
    }

    /**
     * @return array<string,mixed> impact summary
     */
    public function execute(Tournament $tournament, Stage $stage): array
    {
        if ($stage->type === 'knockout') {
            throw new ValidationException([
                'stage_id' => 'La regeneración por inscripción tardía no aplica a fases de eliminación.',
            ]);
        }

        $existingRounds = $this->rounds->findByStage($stage->id);
        if ($existingRounds === []) {
            throw new ValidationException([
                'stage_id' => 'No hay fixtures para regenerar; genera primero los fixtures.',
            ]);
        }

        // Find the late approved team(s) for this tournament.
        $lateRegs = $this->registrations->findLateApprovedByTournament($tournament->id);
        if ($lateRegs === []) {
            throw new ValidationException([
                'stage_id' => 'No hay equipos con inscripción tardía aprobada para regenerar.',
            ]);
        }

        $legs = max(1, $stage->legs);

        // Map each stage group to its group_teams, plus a stage-wide membership
        // lookup so we can scope the late team to the right group (or to the
        // single implicit league when the stage has no groups).
        $stageGroups = $this->groups->findByStage($stage->id);

        $affectedRounds = 0;
        $createdMatches = 0;
        $removedRounds = 0;
        $perScope = [];

        $this->pdo->beginTransaction();

        try {
            foreach ($lateRegs as $reg) {
                $newTeamId = $reg->tournamentTeamId;
                $k = $reg->joinedAtRound ?? 1;

                // Resolve the scope (group_id) the late team belongs to.
                $scopeGroupId = $this->resolveScopeGroupId($stageGroups, $newTeamId);

                // Existing rounds for this scope, with their matches.
                $scopeRounds = $this->existingRoundsForScope($existingRounds, $scopeGroupId);
                if ($scopeRounds === []) {
                    continue;
                }

                $existingTeamIds = $this->teamIdsForScope($scopeGroupId, $scopeRounds);

                $plan = $this->regenerator->regenerate(
                    $scopeRounds,
                    $existingTeamIds,
                    $newTeamId,
                    $k,
                    $legs,
                    $scopeGroupId
                );

                $result = $this->persistPlan($tournament, $stage, $scopeGroupId, $plan);

                $affectedRounds += $plan->affectedRoundCount();
                $createdMatches += $result['matches_created'];
                $removedRounds  += $result['rounds_removed'];

                $perScope[] = [
                    'group_id'                => $scopeGroupId,
                    'new_team_id'             => $newTeamId,
                    'joined_at_round'         => $k,
                    'preserved_round_numbers' => $plan->preservedRoundNumbers,
                    'removed_round_ids'       => $plan->removedRoundIds,
                    'affected_round_count'    => $plan->affectedRoundCount(),
                    'matches_created'         => $result['matches_created'],
                    'rounds_removed'          => $result['rounds_removed'],
                ];
            }

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return [
            'stage_id'             => $stage->id,
            'affected_round_count' => $affectedRounds,
            'matches_created'      => $createdMatches,
            'rounds_removed'       => $removedRounds,
            'scopes'               => $perScope,
        ];
    }

    /**
     * Resolve which group the late team is in. Returns null for a league stage
     * with no groups (single implicit scope).
     *
     * @param array<int,\App\Domain\Group\Group> $stageGroups
     */
    private function resolveScopeGroupId(array $stageGroups, int $teamId): ?int
    {
        foreach ($stageGroups as $group) {
            if ($this->groupTeams->exists($group->id, $teamId)) {
                return $group->id;
            }
        }

        return null;
    }

    /**
     * Build ExistingRound DTOs (with their matches) for the rounds matching the
     * given scope (group_id, or NULL for the implicit league).
     *
     * @param array<int,Round> $allRounds
     *
     * @return array<int,ExistingRound>
     */
    private function existingRoundsForScope(array $allRounds, ?int $scopeGroupId): array
    {
        $result = [];
        foreach ($allRounds as $round) {
            if ($round->groupId !== $scopeGroupId) {
                continue;
            }

            $matches = array_map(
                static fn (Match_ $m): ExistingMatch => new ExistingMatch(
                    $m->id,
                    $m->homeTeamId,
                    $m->awayTeamId,
                    $m->status,
                    $m->leg
                ),
                $this->matches->findByRound($round->id)
            );

            $result[] = new ExistingRound(
                $round->id,
                $round->number,
                $matches,
                $round->status,
                $round->groupId
            );
        }

        return $result;
    }

    /**
     * Collect the distinct team ids already present in the scope. For grouped
     * stages we read group_teams; for the implicit league we derive from the
     * existing matches.
     *
     * @param array<int,ExistingRound> $scopeRounds
     *
     * @return array<int,int>
     */
    private function teamIdsForScope(?int $scopeGroupId, array $scopeRounds): array
    {
        if ($scopeGroupId !== null) {
            $ids = array_map(
                static fn ($gt): int => $gt->tournamentTeamId,
                $this->groupTeams->findByGroup($scopeGroupId)
            );
            if ($ids !== []) {
                return array_values(array_unique($ids));
            }
        }

        // Fallback: derive from existing matches.
        $ids = [];
        foreach ($scopeRounds as $round) {
            foreach ($round->matches as $m) {
                if ($m->homeTeamId !== null) {
                    $ids[$m->homeTeamId] = true;
                }
                if ($m->awayTeamId !== null) {
                    $ids[$m->awayTeamId] = true;
                }
            }
        }

        return array_values(array_map('intval', array_keys($ids)));
    }

    /**
     * Persist a RegenerationPlan for a single scope:
     *  - delete UNPLAYED matches of each removed round, then drop the round if no
     *    matches remain (locked matches keep the round alive — but those are not
     *    in removedRoundIds by construction);
     *  - insert the recomputed future rounds and their matches.
     *
     * @return array{matches_created:int,rounds_removed:int}
     */
    private function persistPlan(
        Tournament $tournament,
        Stage $stage,
        ?int $scopeGroupId,
        RegenerationPlan $plan
    ): array {
        $roundsRemoved = 0;

        foreach ($plan->removedRoundIds as $roundId) {
            // Remove only unplayed matches; locked ones are preserved.
            $this->matches->deleteUnplayedByRound($roundId);

            // Drop the round only if nothing (locked) remains.
            if ($this->matches->findByRound($roundId) === []) {
                $this->rounds->delete($roundId);
                $roundsRemoved++;
            }
        }

        $matchesCreated = 0;

        foreach ($plan->futureRounds as $roundPlan) {
            /** @var RoundPlan $roundPlan */
            $round = $this->rounds->create([
                'stage_id' => $stage->id,
                'group_id' => $scopeGroupId,
                'number'   => $roundPlan->number,
                'name'     => $roundPlan->name,
                'status'   => 'pending',
            ]);

            foreach ($roundPlan->matches() as $pairing) {
                /** @var Pairing $pairing */
                $this->matches->create([
                    'tournament_id' => $tournament->id,
                    'stage_id'      => $stage->id,
                    'group_id'      => $scopeGroupId,
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
            'matches_created' => $matchesCreated,
            'rounds_removed'  => $roundsRemoved,
        ];
    }
}
