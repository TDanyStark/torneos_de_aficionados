<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Application\Action\ApiAction;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user. Roles per tournament are added in later phases.
 */
final class MeAction extends ApiAction
{
    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        return $this->responder->success($this->response, [
            'user'  => $user,
            'roles' => [], // populated in Phase 2 (tournament_user_roles)
        ]);
    }
}
