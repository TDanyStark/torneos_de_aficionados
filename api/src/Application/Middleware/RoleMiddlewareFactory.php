<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Tournament\TournamentRepository;

/**
 * Produces RoleMiddleware instances configured with a required-role-set. Resolve
 * once from the container and call require() per route:
 *
 *   $roleGuard = $container->get(RoleMiddlewareFactory::class);
 *   $route->add($roleGuard->require('organizer'));
 *
 * The tournament id is read from a route argument (defaults to 'id').
 */
final class RoleMiddlewareFactory
{
    public function __construct(
        private TournamentUserRoleRepository $roles,
        private TournamentRepository $tournaments
    ) {
    }

    public function require(string ...$roles): RoleMiddleware
    {
        return new RoleMiddleware($this->roles, $this->tournaments, $roles, 'id');
    }

    /**
     * Same as require() but reads the tournament id from a custom route argument
     * (e.g. when the route is nested under a different parameter name).
     *
     * @param array<int,string> $roles
     */
    public function requireOnArg(string $tournamentArg, array $roles): RoleMiddleware
    {
        return new RoleMiddleware($this->roles, $this->tournaments, $roles, $tournamentArg);
    }
}
