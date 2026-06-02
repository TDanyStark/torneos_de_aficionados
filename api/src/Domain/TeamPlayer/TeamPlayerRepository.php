<?php

declare(strict_types=1);

namespace App\Domain\TeamPlayer;

/**
 * Contract for team_players (roster) persistence. Implemented in Infrastructure.
 */
interface TeamPlayerRepository
{
    public function findById(int $id): ?TeamPlayer;

    /**
     * Roster of a team, joined with player pool data, ordered by shirt number.
     *
     * @return array<int,TeamPlayer>
     */
    public function findByTeam(int $teamId): array;

    /**
     * Number of roster entries for a team (used to enforce roster_limit).
     */
    public function countByTeam(int $teamId): int;

    public function existsForTeamAndPlayer(int $teamId, int $playerId): bool;

    /**
     * Whether a (non-null) shirt number is already taken in the team. Optionally
     * excludes a roster entry id (for updates).
     */
    public function shirtNumberTaken(int $teamId, int $shirtNumber, ?int $exceptId = null): bool;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): TeamPlayer;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): TeamPlayer;

    public function delete(int $id): void;
}
