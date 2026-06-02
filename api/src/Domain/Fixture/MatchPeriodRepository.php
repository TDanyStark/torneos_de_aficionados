<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

/**
 * Contract for match periods persistence. Implemented in Infrastructure.
 */
interface MatchPeriodRepository
{
    public function findById(int $id): ?MatchPeriod;

    /**
     * All periods of a match, ordered by number ASC.
     *
     * @return array<int,MatchPeriod>
     */
    public function findByMatch(int $matchId): array;

    /**
     * The currently running period of a match (status = 'running'), if any.
     */
    public function findActiveByMatch(int $matchId): ?MatchPeriod;

    /**
     * @param array<string,mixed> $data match_id, number, status?, started_at?, ended_at?
     */
    public function create(array $data): MatchPeriod;

    /**
     * Updates only whitelisted fields (status, started_at, ended_at).
     *
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): MatchPeriod;
}
