<?php

declare(strict_types=1);

namespace App\Application\Actions\Team;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Team\TeamRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/my-team  (authenticated)
 *
 * Whether the current user already enrolled a team (as delegate) in this
 * tournament. Powers the public hub button: "Inscribir mi equipo" vs "Mi
 * equipo". Returns null when the user has no active team here.
 *
 * Response 200: null | { team_id, team_status, slug, registration_status }
 */
final class ShowMyTeamInTournamentAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private TeamRepository $teams,
        private RegistrationRepository $registrations
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

        $team = $this->teams->findByDelegateInTournament($tournamentId, $user->id);
        if ($team === null) {
            return $this->responder->success($this->response, null);
        }

        $registration = $this->registrations->findByTeam($team->id);

        return $this->responder->success($this->response, [
            'team_id'             => $team->id,
            'team_status'         => $team->status,
            'slug'                => $tournament->slug,
            'registration_status' => $registration?->status,
        ]);
    }
}
