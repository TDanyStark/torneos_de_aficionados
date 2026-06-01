<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\UnauthorizedException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Routing\RouteContext;

/**
 * Guards tournament-scoped routes. Reads the {id} route argument as the
 * tournament id, looks up the authenticated user's roles in that tournament and
 * passes if the user holds at least one of the required roles. Global admins
 * (users.is_admin) always pass.
 *
 * Must run AFTER JwtAuthMiddleware (relies on the "user" request attribute) and
 * is configured per-route via RoleMiddlewareFactory::require().
 */
final class RoleMiddleware implements MiddlewareInterface
{
    /**
     * @param array<int,string> $requiredRoles
     */
    public function __construct(
        private TournamentUserRoleRepository $roles,
        private TournamentRepository $tournaments,
        private array $requiredRoles,
        private string $tournamentArg = 'id'
    ) {
    }

    public function process(Request $request, Handler $handler): Response
    {
        /** @var User|null $user */
        $user = $request->getAttribute('user');
        if (!$user instanceof User) {
            throw new UnauthorizedException('Autenticación requerida.');
        }

        // Global admins bypass tournament role checks.
        if ($user->isAdmin) {
            return $handler->handle($request);
        }

        $tournamentId = $this->resolveTournamentId($request);

        $tournament = $this->tournaments->findById($tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $userRoles = $this->roles->rolesForUserInTournament($user->id, $tournamentId);

        if (array_intersect($this->requiredRoles, $userRoles) === []) {
            throw new ForbiddenException('No tienes permiso para realizar esta acción en este torneo.');
        }

        return $handler->handle($request);
    }

    private function resolveTournamentId(Request $request): int
    {
        $route = $request->getAttribute('__route__');

        $value = null;
        if ($route !== null && method_exists($route, 'getArgument')) {
            $value = $route->getArgument($this->tournamentArg);
        }

        if ($value === null || !ctype_digit((string) $value)) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        return (int) $value;
    }
}
