<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

/**
 * Contract for match events persistence + derived tournament statistics
 * (top scorers, discipline). Implemented in Infrastructure.
 */
interface MatchEventRepository
{
    public function findById(int $id): ?MatchEvent;

    /**
     * All events of a match, ordered by id ASC (chronological insert order).
     *
     * @return array<int,MatchEvent>
     */
    public function findByMatch(int $matchId): array;

    /**
     * All events of a match enriched with player_name (players.full_name) and
     * team_name (tournament_teams.name) for the public live timeline, ordered by
     * id ASC. Marker events (period_start/period_end) have null names.
     *
     * Row shape (snake_case): id, match_id, match_period_id, type, team_id,
     * team_name, player_id, player_name, minute, created_at.
     *
     * @return array<int,array<string,mixed>>
     */
    public function findByMatchWithNames(int $matchId): array;

    /**
     * @param array<string,mixed> $data match_id, type, plus optional
     *                                  match_period_id, team_id, player_id,
     *                                  minute, created_by_user_id
     */
    public function create(array $data): MatchEvent;

    public function delete(int $id): void;

    /**
     * Top scorers of a tournament: goals per player (type = 'goal' only;
     * own_goal does NOT count for the scorer). One row per player, ordered by
     * goals DESC. Scope: events whose match.tournament_id = $tournamentId.
     *
     * Row shape (snake_case): player_id, player_name, team_id, team_name, goals.
     *
     * @return array<int,array<string,mixed>>
     */
    public function topScorers(int $tournamentId, int $limit, int $offset): array;

    /**
     * Total number of distinct scorers in the tournament (for pagination meta).
     */
    public function countTopScorers(int $tournamentId): int;

    /**
     * Discipline per player: yellow_card and red_card counts. One row per
     * player, ordered by reds DESC, yellows DESC. Scope: events whose
     * match.tournament_id = $tournamentId.
     *
     * Row shape (snake_case): player_id, player_name, team_id, team_name,
     * yellow_cards, red_cards.
     *
     * @return array<int,array<string,mixed>>
     */
    public function cardsByPlayer(int $tournamentId, int $limit, int $offset): array;

    /**
     * Total number of distinct carded players in the tournament (pagination).
     */
    public function countCardsByPlayer(int $tournamentId): int;
}
