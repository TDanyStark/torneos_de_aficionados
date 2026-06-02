<?php

declare(strict_types=1);

namespace App\Application\Actions\TeamPlayer;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Team\TeamRepository;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/team-players/{id}  (organizer|delegate)
 * Removes a player from a team's roster. {id} is the roster entry id ->
 * resolved team -> tournament for the inline check.
 */
final class DeleteTeamPlayerAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TeamPlayerRepository $teamPlayers,
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

        $teamPlayer = $this->teamPlayers->findById($id);
        if ($teamPlayer === null) {
            throw new NotFoundException('Jugador de la plantilla no encontrado.');
        }

        $team = $this->teams->findById($teamPlayer->tournamentTeamId);
        if ($team === null) {
            throw new NotFoundException('Equipo no encontrado.');
        }

        $this->authorizer->assert($user, $team->tournamentId, ['organizer', 'delegate']);

        $this->teamPlayers->delete($id);

        return $this->responder->noContent($this->response);
    }
}
