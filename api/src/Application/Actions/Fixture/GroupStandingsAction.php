<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Fixture\StandingsCalculator;
use App\Domain\Group\GroupRepository;
use App\Domain\GroupTeam\GroupTeamRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Sport\SportModuleRegistry;
use App\Domain\Sport\SportRepository;
use App\Domain\Stage\StageRepository;
use App\Domain\Standings\StandingsConfig;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/groups/{id}/standings  (PUBLIC)
 *
 * Resolves the tournament's sport module -> StandingsStrategy, builds the config
 * from tournaments.points_* + stages.tiebreakers, gathers the group's finished
 * matches and computes ordered standing rows.
 */
final class GroupStandingsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private GroupRepository $groups,
        private StageRepository $stages,
        private TournamentRepository $tournaments,
        private GroupTeamRepository $groupTeams,
        private MatchRepository $matches,
        private SportRepository $sports,
        private SportModuleRegistry $registry
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $groupId = (int) $this->arg('id', '0');

        $group = $this->groups->findById($groupId);
        if ($group === null) {
            throw new NotFoundException('Grupo no encontrado.');
        }

        $stage = $this->stages->findById($group->stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $tournament = $this->tournaments->findById($stage->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $sport = $this->sports->findById($tournament->sportId);
        if ($sport === null) {
            throw new NotFoundException('Deporte no encontrado.');
        }

        // Resolve the sport module's standings strategy via the registry.
        $module = $this->registry->get($sport->moduleKey);
        $calculator = new StandingsCalculator($module->standingsStrategy());

        // Build config from tournament points + the stage tiebreakers.
        $config = StandingsConfig::create(
            $tournament->pointsWin,
            $tournament->pointsDraw,
            $tournament->pointsLoss,
            $stage->tiebreakers
        );

        // Teams in the group + their names.
        $assignments = $this->groupTeams->findByGroup($groupId);
        $teamIds = [];
        $teamNames = [];
        foreach ($assignments as $gt) {
            $teamIds[] = $gt->tournamentTeamId;
            if ($gt->teamName !== null) {
                $teamNames[$gt->tournamentTeamId] = $gt->teamName;
            }
        }

        // Finished matches of the group as raw rows.
        $matchRows = $this->matches->findFinishedRowsByGroup($groupId);

        $rows = $calculator->calculate($teamIds, $matchRows, $config, $teamNames);

        return $this->responder->success($this->response, [
            'group_id' => $groupId,
            'stage_id' => $stage->id,
            'standings' => $rows,
        ]);
    }
}
