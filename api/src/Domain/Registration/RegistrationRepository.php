<?php

declare(strict_types=1);

namespace App\Domain\Registration;

use App\Domain\Shared\Pagination;

/**
 * Contract for registrations persistence. Implemented in Infrastructure.
 */
interface RegistrationRepository
{
    public function findById(int $id): ?Registration;

    /** The (latest) registration for a given team, if any. */
    public function findByTeam(int $teamId): ?Registration;

    /**
     * Paginated inbox for a tournament. Pending/submitted first, then
     * updated_at DESC.
     *
     * @return array<int,Registration>
     */
    public function paginateByTournament(int $tournamentId, Pagination $pagination): array;

    public function countByTournament(int $tournamentId): int;

    /**
     * Read-model: the registrations a user submitted as the team delegate,
     * enriched with tournament (name/slug/logo) and team data, newest first.
     * Powers the "Mis inscripciones" view. Roles are per-tournament, so this is
     * scoped strictly to teams where the user is the delegate.
     *
     * @return array<int,array<string,mixed>>
     */
    public function findByDelegateUser(int $userId): array;

    /**
     * Late, APPROVED registrations of a tournament (is_late = 1 AND the team is
     * approved), ordered by joined_at_round ASC then id ASC. Used by the fixture
     * regenerator to find the late team that joined at round K.
     *
     * @return array<int,Registration>
     */
    public function findLateApprovedByTournament(int $tournamentId): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Registration;

    public function setStatus(int $id, string $status): Registration;
}
