<?php

declare(strict_types=1);

namespace App\Application\Actions\Role;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/tournament-roles/{id}  (organizer of the role's tournament)
 * Removes a role assignment. Authorization is enforced here (not via
 * RoleMiddleware) because {id} is the role id, not the tournament id.
 */
final class DeleteTournamentRoleAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentUserRoleRepository $roles
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $roleId = (int) $this->arg('id', '0');

        $role = $this->roles->findById($roleId);
        if ($role === null) {
            throw new NotFoundException('Asignación de rol no encontrada.');
        }

        if (!$user->isAdmin) {
            $userRoles = $this->roles->rolesForUserInTournament($user->id, $role->tournamentId);
            if (!in_array('organizer', $userRoles, true)) {
                throw new ForbiddenException('Solo un organizador puede eliminar roles de este torneo.');
            }
        }

        $this->roles->delete($roleId);

        return $this->responder->noContent($this->response);
    }
}
