<?php

declare(strict_types=1);

namespace App\Application\Actions\TeamPlayer;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Player\PlayerRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Team\TeamRepository;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/tournament-teams/{id}/players  (organizer|delegate)
 * Adds a player to a team's roster. Reuse-by-cédula: resolve the organizer from
 * the team's tournament owner, look up the player by (organizer, document_id);
 * if found reuse it (personal data ignored), else create the pool player first.
 * Enforces unique shirt number per team. {id} is the team id -> authorized
 * inline via team -> tournament.
 */
final class AddPlayerToTeamAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TeamRepository $teams,
        private TournamentRepository $tournaments,
        private PlayerRepository $players,
        private TeamPlayerRepository $teamPlayers,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $teamId = (int) $this->arg('id', '0');

        $team = $this->teams->findById($teamId);
        if ($team === null) {
            throw new NotFoundException('Equipo no encontrado.');
        }

        $this->authorizer->assert($user, $team->tournamentId, ['organizer', 'delegate']);

        $tournament = $this->tournaments->findById($team->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }
        $organizerUserId = $tournament->ownerUserId;

        $body = $this->body();

        $documentId = isset($body['document_id']) ? trim((string) $body['document_id']) : '';
        if ($documentId === '') {
            throw new ValidationException(['document_id' => 'La cédula es obligatoria.']);
        }

        // Roster data.
        $shirtNumber = isset($body['shirt_number']) && $body['shirt_number'] !== '' && $body['shirt_number'] !== null
            ? (int) $body['shirt_number']
            : null;
        $position  = isset($body['position']) && $body['position'] !== '' ? (string) $body['position'] : null;
        $isCaptain = !empty($body['is_captain']);
        $isDelegate = !empty($body['is_delegate']);

        // Dorsal unique per team.
        if ($shirtNumber !== null && $this->teamPlayers->shirtNumberTaken($teamId, $shirtNumber)) {
            throw new ValidationException(['shirt_number' => 'El dorsal ya está asignado en este equipo.']);
        }

        // Reuse-by-cédula: look up the player in the organizer pool.
        $player = $this->players->findByOrganizerAndDocument($organizerUserId, $documentId);

        if ($player === null) {
            // New player: full personal data required.
            $fullName = isset($body['full_name']) ? trim((string) $body['full_name']) : '';
            if ($fullName === '') {
                throw new ValidationException(['full_name' => 'El nombre completo del jugador es obligatorio.']);
            }
            $birthdate = isset($body['birthdate']) && $body['birthdate'] !== '' ? (string) $body['birthdate'] : null;
            $photoUrl  = isset($body['photo_url']) && $body['photo_url'] !== '' ? (string) $body['photo_url'] : null;
            $phone     = isset($body['phone']) && $body['phone'] !== '' ? (string) $body['phone'] : null;

            $player = $this->players->create([
                'organizer_user_id' => $organizerUserId,
                'user_id'           => null,
                'document_id'       => $documentId,
                'full_name'         => $fullName,
                'birthdate'         => $birthdate,
                'photo_url'         => $photoUrl,
                'phone'             => $phone,
            ]);
        }

        // The player must not already be on this roster.
        if ($this->teamPlayers->existsForTeamAndPlayer($teamId, $player->id)) {
            throw new ValidationException(['document_id' => 'El jugador ya está en la plantilla de este equipo.']);
        }

        $teamPlayer = $this->teamPlayers->create([
            'tournament_team_id' => $teamId,
            'player_id'          => $player->id,
            'shirt_number'       => $shirtNumber,
            'position'           => $position,
            'is_captain'         => $isCaptain,
            'is_delegate'        => $isDelegate,
            'status'             => 'active',
        ]);

        return $this->responder->created($this->response, $teamPlayer);
    }
}
