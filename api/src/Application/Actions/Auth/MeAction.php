<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user plus their tournament roles as
 * [{tournament_id, role, team_id}] (may include multiple entries per tournament).
 */
final class MeAction extends ApiAction
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

        $roles = array_map(
            static fn ($role): array => [
                'tournament_id' => $role->tournamentId,
                'role'          => $role->role,
                'team_id'       => $role->teamId,
            ],
            $this->roles->findByUser($user->id)
        );

        return $this->responder->success($this->response, [
            'user'  => $user,
            'roles' => $roles,
        ]);
    }
}
