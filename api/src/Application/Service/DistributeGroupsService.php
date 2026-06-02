<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Group\GroupRepository;
use App\Domain\GroupTeam\GroupTeamRepository;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Shared\Pagination;
use App\Domain\Stage\Stage;
use App\Domain\Team\TeamRepository;
use App\Domain\Tournament\Tournament;
use PDO;

/**
 * Transactional coordinator that creates N groups for a "groups" stage and
 * round-robin distributes the tournament's APPROVED teams across them. Mirrors
 * RegisterTeamService: inject PDO + repositories, run the whole multi-table
 * mutation inside a single transaction (beginTransaction/commit/rollBack on
 * \Throwable).
 *
 * Destructive-by-design: existing groups of the stage are deleted first (which
 * cascades to group_teams), then the requested groups are recreated and filled.
 *
 * The team ids used for group_teams.tournament_team_id are the Team entity ids
 * returned by TeamRepository::paginateByTournament — Team IS the tournament_teams
 * row, so $team->id is exactly the tournament_teams.id that
 * AssignTeamToGroupAction validates and stores. This keeps automatic
 * distribution consistent with the manual assignment path.
 */
final class DistributeGroupsService
{
    public function __construct(
        private PDO $pdo,
        private GroupRepository $groups,
        private GroupTeamRepository $groupTeams,
        private TeamRepository $teams
    ) {
    }

    /**
     * @return array<string,mixed> summary { stage_id, groups_created, teams_distributed }
     */
    public function execute(Tournament $tournament, Stage $stage, int $count, bool $random = true): array
    {
        if ($stage->type !== 'groups') {
            throw new ValidationException([
                'stage_id' => 'La distribución automática solo aplica a fases de tipo grupos.',
            ]);
        }

        $teamIds = $this->approvedTeamIds($tournament->id);

        if ($random) {
            shuffle($teamIds);
        }

        $this->pdo->beginTransaction();

        try {
            // Wipe existing groups of the stage (cascade removes group_teams).
            foreach ($this->groups->findByStage($stage->id) as $existing) {
                $this->groups->delete($existing->id);
            }

            // Create the requested groups: "Grupo A", "Grupo B", ...
            $groupIds = [];
            for ($i = 0; $i < $count; $i++) {
                $group = $this->groups->create($stage->id, [
                    'name'     => 'Grupo ' . chr(65 + $i),
                    'position' => $i + 1,
                ]);
                $groupIds[] = $group->id;
            }

            // Round-robin distribution: team[k] -> group index k % count.
            $distributed = 0;
            foreach ($teamIds as $k => $tid) {
                $this->groupTeams->create([
                    'group_id'           => $groupIds[$k % $count],
                    'tournament_team_id' => $tid,
                    'seed'               => null,
                ]);
                $distributed++;
            }

            $this->pdo->commit();

            return [
                'stage_id'          => $stage->id,
                'groups_created'    => $count,
                'teams_distributed' => $distributed,
            ];
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Approved tournament teams, reusing the exact path of
     * GenerateFixtureService::approvedTeamIds(). Team entity ids ARE the
     * tournament_teams ids referenced by group_teams.tournament_team_id.
     *
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
}
