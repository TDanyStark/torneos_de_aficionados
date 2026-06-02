<?php

declare(strict_types=1);

namespace App\Domain\Team;

use App\Domain\Shared\Pagination;

/**
 * Contract for tournament_teams persistence. Implemented in Infrastructure.
 */
interface TeamRepository
{
    public function findById(int $id): ?Team;

    /**
     * Paginated public listing for a tournament with optional filters.
     *
     * @param array{status?:?string,q?:?string} $filters
     * @return array<int,Team>
     */
    public function paginateByTournament(int $tournamentId, Pagination $pagination, array $filters): array;

    /**
     * @param array{status?:?string,q?:?string} $filters
     */
    public function countByTournament(int $tournamentId, array $filters): int;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Team;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Team;

    public function setStatus(int $id, string $status): Team;

    public function softDelete(int $id): void;
}
