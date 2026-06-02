<?php

declare(strict_types=1);

namespace App\Application\Actions\Registration;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Team\TeamRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PATCH /api/v1/registrations/{id}  (organizer)
 * Approves or rejects a registration. On approval the team becomes 'approved'
 * (available for fixtures); on rejection the team becomes 'rejected'. {id} is
 * the registration id -> resolved tournament for the inline check.
 */
final class UpdateRegistrationAction extends ApiAction
{
    private const ALLOWED = ['approved', 'rejected'];

    public function __construct(
        JsonResponder $responder,
        private RegistrationRepository $registrations,
        private TeamRepository $teams,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $registration = $this->registrations->findById($id);
        if ($registration === null) {
            throw new NotFoundException('Inscripción no encontrada.');
        }

        $this->authorizer->assert($user, $registration->tournamentId, ['organizer']);

        $body = $this->body();
        $status = isset($body['status']) ? (string) $body['status'] : '';
        if (!in_array($status, self::ALLOWED, true)) {
            throw new ValidationException(['status' => 'El estado debe ser "approved" o "rejected".']);
        }

        $registration = $this->registrations->setStatus($id, $status);

        // Sync the team's lifecycle with the registration decision.
        $teamStatus = $status === 'approved' ? 'approved' : 'rejected';
        $team = $this->teams->setStatus($registration->tournamentTeamId, $teamStatus);

        return $this->responder->success($this->response, [
            'registration' => $registration,
            'team'         => $team,
        ]);
    }
}
