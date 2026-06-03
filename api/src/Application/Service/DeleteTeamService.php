<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Team\TeamRepository;
use PDO;

/**
 * Coordinates organizer-driven team removal. A team that is already inscribed
 * (and possibly approved + scheduled) cannot simply be soft-deleted: its
 * matches and the goals/cards recorded against those matches (the goleadores)
 * must be purged too, otherwise fixtures and derived stats are left dangling.
 *
 * Because match_events.player_id -> players.id is SET_NULL (history is kept for
 * roster cleanup), deleting a TEAM requires us to explicitly remove the events
 * tied to that team's matches before deleting the matches themselves.
 *
 * The pooled `players` rows (organizer pool) are deliberately preserved; only
 * the team's roster entries (team_players) are removed.
 *
 * Mirrors the transaction-coordinator pattern of RegisterTeamService: injects
 * the shared PDO plus the team repository and wraps the multi-table cleanup in
 * a single transaction, ending with a soft-delete of the team (audit trail).
 */
final class DeleteTeamService
{
    public function __construct(
        private PDO $pdo,
        private TeamRepository $teams
    ) {
    }

    /**
     * Counts of what a deletion would remove, so the UI can warn the organizer
     * before they confirm. Returns zeros for a team with no activity.
     *
     * @return array{players:int,matches:int,events:int,goals:int,groups:int}
     */
    public function impact(int $teamId): array
    {
        return [
            'players' => $this->countTeamPlayers($teamId),
            'matches' => $this->countMatches($teamId),
            'events'  => $this->countEvents($teamId),
            'goals'   => $this->countGoals($teamId),
            'groups'  => $this->countGroupPlacements($teamId),
        ];
    }

    /**
     * Atomically purge a team's matches, match events, group/bracket
     * placements and roster entries, then soft-delete the team.
     */
    public function delete(int $teamId): void
    {
        $this->pdo->beginTransaction();

        try {
            // 1) Delete match_events (goals/cards/period markers) for every
            //    match this team played, home or away. Must run before the
            //    matches are removed.
            $this->exec(
                'DELETE me FROM match_events me
                 INNER JOIN matches m ON m.id = me.match_id
                 WHERE m.home_team_id = :home OR m.away_team_id = :away',
                ['home' => $teamId, 'away' => $teamId]
            );

            // 2) Delete the matches themselves (partidos).
            $this->exec(
                'DELETE FROM matches WHERE home_team_id = :home OR away_team_id = :away',
                ['home' => $teamId, 'away' => $teamId]
            );

            // 3) Remove group placements referencing the team.
            $this->exec(
                'DELETE FROM group_teams WHERE tournament_team_id = :t',
                ['t' => $teamId]
            );

            // 4) Remove the team's roster entries. Pooled players are preserved.
            $this->exec(
                'DELETE FROM team_players WHERE tournament_team_id = :t',
                ['t' => $teamId]
            );

            // 5) Soft-delete the team (keeps an audit trail via deleted_at).
            $this->teams->softDelete($teamId);

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function countTeamPlayers(int $teamId): int
    {
        return $this->scalar(
            'SELECT COUNT(*) FROM team_players WHERE tournament_team_id = :t',
            ['t' => $teamId]
        );
    }

    private function countMatches(int $teamId): int
    {
        return $this->scalar(
            'SELECT COUNT(*) FROM matches WHERE home_team_id = :home OR away_team_id = :away',
            ['home' => $teamId, 'away' => $teamId]
        );
    }

    private function countEvents(int $teamId): int
    {
        return $this->scalar(
            'SELECT COUNT(*) FROM match_events me
             INNER JOIN matches m ON m.id = me.match_id
             WHERE m.home_team_id = :home OR m.away_team_id = :away',
            ['home' => $teamId, 'away' => $teamId]
        );
    }

    private function countGoals(int $teamId): int
    {
        return $this->scalar(
            "SELECT COUNT(*) FROM match_events me
             INNER JOIN matches m ON m.id = me.match_id
             WHERE (m.home_team_id = :home OR m.away_team_id = :away)
               AND me.type IN ('goal', 'own_goal')",
            ['home' => $teamId, 'away' => $teamId]
        );
    }

    private function countGroupPlacements(int $teamId): int
    {
        return $this->scalar(
            'SELECT COUNT(*) FROM group_teams WHERE tournament_team_id = :t',
            ['t' => $teamId]
        );
    }

    /**
     * @param array<string,int> $params
     */
    private function scalar(string $sql, array $params): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * @param array<string,int> $params
     */
    private function exec(string $sql, array $params): void
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
    }
}
