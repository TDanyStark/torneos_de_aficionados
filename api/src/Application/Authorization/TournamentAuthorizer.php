<?php

declare(strict_types=1);

namespace App\Application\Authorization;

use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\User\User;

/**
 * Centralizes tournament role checks for actions that operate on nested
 * resources (stages, groups, advancement rules) where the route argument is the
 * child id rather than the tournament id, so RoleMiddleware cannot guard them.
 */
final class TournamentAuthorizer
{
    public function __construct(private TournamentUserRoleRepository $roles)
    {
    }

    /**
     * Ensures the user holds at least one of the given roles in the tournament.
     * Global admins always pass.
     *
     * @param array<int,string> $requiredRoles
     */
    public function assert(User $user, int $tournamentId, array $requiredRoles): void
    {
        if ($user->isAdmin) {
            return;
        }

        $userRoles = $this->roles->rolesForUserInTournament($user->id, $tournamentId);

        if (array_intersect($requiredRoles, $userRoles) === []) {
            throw new ForbiddenException('No tienes permiso para realizar esta acción en este torneo.');
        }
    }
}
