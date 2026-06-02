<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

/**
 * Contract for matches persistence. Implemented in Infrastructure (Part B).
 */
interface MatchRepository
{
    public function findById(int $id): ?Match_;

    /**
     * Matches of a tournament, optionally filtered. Ordered by round number ASC
     * for public fixtures (calendar order).
     *
     * @param array<string,mixed> $filters round|group|status
     *
     * @return array<int,Match_>
     */
    public function findByTournament(int $tournamentId, array $filters = []): array;

    /**
     * Finished matches of a group (input to StandingsCalculator). Raw rows.
     *
     * @return array<int,array<string,mixed>>
     */
    public function findFinishedRowsByGroup(int $groupId): array;

    /**
     * @return array<int,Match_>
     */
    public function findByRound(int $roundId): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Match_;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Match_;

    public function delete(int $id): void;

    /**
     * Deletes all non-consolidated matches of a round (used during regenerate).
     */
    public function deleteUnplayedByRound(int $roundId): void;
}
