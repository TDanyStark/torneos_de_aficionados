<?php

declare(strict_types=1);

namespace App\Domain\Tournament;

use App\Domain\Shared\Pagination;

/**
 * Contract for tournament persistence. Implemented in Infrastructure.
 */
interface TournamentRepository
{
    public function findById(int $id): ?Tournament;

    public function findBySlug(string $slug): ?Tournament;

    public function slugExists(string $slug): bool;

    public function registrationCodeExists(string $code): bool;

    /**
     * Paginated public listing with optional filters.
     *
     * @param array{sport_id?:?int,status?:?string,q?:?string} $filters
     * @return array<int,Tournament>
     */
    public function paginate(Pagination $pagination, array $filters): array;

    /**
     * @param array{sport_id?:?int,status?:?string,q?:?string} $filters
     */
    public function countAll(array $filters): int;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Tournament;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Tournament;

    public function softDelete(int $id): void;
}
