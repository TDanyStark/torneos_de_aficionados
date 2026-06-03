<?php

declare(strict_types=1);

namespace App\Application\Actions\TeamPlayer;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Player\PlayerRepository;
use App\Domain\Shared\Exception\ForbiddenException;
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

        // Once registrations close, only the organizer (or admin) may change the
        // roster. Delegates are locked out of adding players.
        $isOrganizer = $this->userHasRole($user, $team->tournamentId, 'organizer');
        if (!$user->isAdmin && !$isOrganizer && !$tournament->registrationOpen) {
            throw new ForbiddenException('Las inscripciones están cerradas. Solo el organizador puede modificar la plantilla.');
        }

        $organizerUserId = $tournament->ownerUserId;

        $body = $this->body();

        $documentId = isset($body['document_id']) ? trim((string) $body['document_id']) : '';
        if ($documentId === '') {
            throw new ValidationException(['document_id' => 'La cédula es obligatoria.']);
        }

        // Enforce roster_limit (NULL = unlimited) before adding the entry.
        if ($tournament->rosterLimit !== null
            && $this->teamPlayers->countByTeam($teamId) >= $tournament->rosterLimit) {
            throw new ValidationException([
                'document_id' => "El equipo alcanzó el límite de jugadores ({$tournament->rosterLimit}).",
            ]);
        }

        $alias = isset($body['alias']) ? trim((string) $body['alias']) : null;
        if ($alias !== null && mb_strlen($alias) > 60) {
            throw new ValidationException(['alias' => 'El alias no puede superar 60 caracteres.']);
        }
        $alias = ($alias !== null && $alias !== '') ? $alias : null;

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
                'alias'             => $alias,
                'birthdate'         => $birthdate,
                'photo_url'         => $photoUrl,
                'phone'             => $phone,
            ]);
        } elseif ($alias !== null) {
            // Reusing a pool player: refresh the alias when one was provided.
            $player = $this->players->update($player->id, ['alias' => $alias]);
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

    private function userHasRole(User $user, int $tournamentId, string $role): bool
    {
        try {
            $this->authorizer->assert($user, $tournamentId, [$role]);

            return true;
        } catch (ForbiddenException) {
            return false;
        }
    }
}
