<?php

declare(strict_types=1);

namespace App\Domain\Role;

/**
 * Contract for tournament_user_roles persistence. Implemented in Infrastructure.
 */
interface TournamentUserRoleRepository
{
    public function findById(int $id): ?TournamentUserRole;

    /**
     * All role rows for a tournament (enriched with user name/email).
     *
     * @return array<int,TournamentUserRole>
     */
    public function findByTournament(int $tournamentId): array;

    /**
     * Distinct role names a user holds within a tournament.
     *
     * @return array<int,string>
     */
    public function rolesForUserInTournament(int $userId, int $tournamentId): array;

    /**
     * All role rows for a user across every tournament. Used by MeAction.
     *
     * @return array<int,TournamentUserRole>
     */
    public function findByUser(int $userId): array;

    public function exists(int $tournamentId, int $userId, string $role, ?int $teamId): bool;

    public function create(int $tournamentId, int $userId, string $role, ?int $teamId): TournamentUserRole;

    public function delete(int $id): void;
}
