<?php

declare(strict_types=1);

namespace App\Application\Actions\Team;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Team\TeamRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/tournaments/{id}/teams  (organizer OR delegate)
 * Creates a team in 'pending' status and records a manual registration so the
 * organizer's inbox stays consistent. {id} is the tournament id (RoleMiddleware
 * already guarded organizer|delegate).
 *
 * Delegate ownership: a team created by an ORGANIZER has NO delegate
 * (delegate_user_id = null) — organizers are never a team's delegate. Only a
 * delegate creating a team becomes its delegate.
 */
final class CreateTeamAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TeamRepository $teams,
        private TournamentRepository $tournaments,
        private RegistrationRepository $registrations,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $tournamentId = (int) $this->arg('id', '0');

        $tournament = $this->tournaments->findById($tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $body = $this->body();

        $name      = trim((string) ($body['name'] ?? ''));
        $shortName = isset($body['short_name']) ? trim((string) $body['short_name']) : null;
        $coachName = isset($body['coach_name']) ? trim((string) $body['coach_name']) : null;
        $logoUrl   = isset($body['logo_url']) ? trim((string) $body['logo_url']) : null;

        if ($name === '') {
            throw new ValidationException(['name' => 'El nombre del equipo es obligatorio.']);
        }
        if ($shortName !== null && $shortName !== '' && mb_strlen($shortName) > 3) {
            throw new ValidationException(['short_name' => 'La abreviatura no puede superar 3 caracteres.']);
        }
        if ($coachName !== null && mb_strlen($coachName) > 120) {
            throw new ValidationException(['coach_name' => 'El nombre del entrenador no puede superar 120 caracteres.']);
        }

        $team = $this->teams->create([
            'tournament_id'    => $tournamentId,
            'name'             => $name,
            'short_name'       => $shortName !== '' ? $shortName : null,
            'coach_name'       => $coachName !== '' ? $coachName : null,
            'logo_url'         => $logoUrl !== '' ? $logoUrl : null,
            'delegate_user_id' => $user->id,
            'status'           => 'pending',
        ]);

        // Record a manual registration so the inbox reflects the new team.
        $this->registrations->create([
            'tournament_id'      => $tournamentId,
            'tournament_team_id' => $team->id,
            'channel'            => 'manual',
            'status'             => 'pending',
        ]);

        return $this->responder->created($this->response, $team);
    }
}
