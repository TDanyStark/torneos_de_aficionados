<?php

declare(strict_types=1);

namespace App\Application\Actions\Registration;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/me/registrations  (authenticated)
 *
 * Read-model for the "Mis inscripciones" view: every tournament where the
 * authenticated user enrolled a team as its delegate, with the registration
 * status. Roles are per-tournament, so this lists ONLY the user's delegate
 * registrations and is independent of any organizer/referee/player role the
 * user may hold in other tournaments.
 *
 * Response 200: [ { registration_id, registration_status, channel, is_late,
 *   team_id, team_name, team_status, tournament_id, tournament_name,
 *   tournament_slug, tournament_logo_url, tournament_state }, ... ]
 */
final class ListMyRegistrationsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private RegistrationRepository $registrations
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $rows = $this->registrations->findByDelegateUser($user->id);

        return $this->responder->success($this->response, $rows);
    }
}
