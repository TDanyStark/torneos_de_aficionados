<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PATCH /api/v1/me/tournaments/{id}/visibility  (authenticated)
 * Body: { "hidden": bool }
 *
 * Hides ($hidden=true) or restores ($hidden=false) a tournament from the
 * current user's "Torneos que sigo" feed. Non-destructive: it only toggles
 * hidden_at on the user's role rows for that tournament; the role and team
 * stay intact. 404 when the user has no organizer/delegate role there.
 *
 * Response 200: { "tournament_id": int, "hidden": bool }
 */
final class SetFollowedVisibilityAction extends ApiAction
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

        $tournamentId = (int) $this->arg('id', '0');

        $body = $this->body();
        $hidden = !empty($body['hidden']);

        $affected = $this->roles->setHidden($tournamentId, $user->id, $hidden);
        if ($affected === 0) {
            throw new NotFoundException('No tienes una relación con este torneo.');
        }

        return $this->responder->success($this->response, [
            'tournament_id' => $tournamentId,
            'hidden'        => $hidden,
        ]);
    }
}
