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

    /**
     * Full tournament entities owned by a user, newest first.
     *
     * By default ($filedOnly=false) archived tournaments (is_filed=1) are
     * excluded. Pass $filedOnly=true to return ONLY the archived ones (the
     * dashboard "Archivados" view).
     *
     * @return array<int,Tournament>
     */
    public function findByOwner(int $userId, bool $filedOnly = false): array;

    public function findByRegistrationCode(string $code): ?Tournament;

    /**
     * Full tournament entities where the user holds at least one of the given
     * per-tournament roles (e.g. organizer, delegate), newest first. Deduped.
     *
     * By default ($includeHidden=false) tournaments the user has hidden are
     * excluded (a tournament is hidden when ALL their matching role rows have
     * hidden_at set). Pass $includeHidden=true to return ONLY the hidden ones
     * (the "Ver ocultos" view).
     *
     * @param array<int,string> $roles
     * @return array<int,Tournament>
     */
    public function findByMemberRoles(int $userId, array $roles, bool $includeHidden = false): array;

    public function slugExists(string $slug): bool;

    public function registrationCodeExists(string $code): bool;

    /**
     * Paginated public listing with optional filters.
     *
     * @param array{sport_id?:?int,status?:?string,q?:?string,public_only?:?bool} $filters
     * @return array<int,Tournament>
     */
    public function paginate(Pagination $pagination, array $filters): array;

    /**
     * @param array{sport_id?:?int,status?:?string,q?:?string,public_only?:?bool} $filters
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

    /**
     * Archive ($filed=true) or restore ($filed=false) a tournament by toggling
     * its is_filed flag. Independent of status and soft-delete.
     */
    public function setFiled(int $id, bool $filed): void;
}
