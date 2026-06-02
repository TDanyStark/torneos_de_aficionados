<?php

declare(strict_types=1);

namespace App\Application\Actions\TeamPlayer;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Team\TeamRepository;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournament-teams/{id}/players  (public)
 * Roster of a team joined with player pool data, ordered by shirt number.
 */
final class ListRosterAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TeamPlayerRepository $teamPlayers,
        private TeamRepository $teams
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $teamId = (int) $this->arg('id', '0');

        if ($this->teams->findById($teamId) === null) {
            throw new NotFoundException('Equipo no encontrado.');
        }

        $roster = $this->teamPlayers->findByTeam($teamId);

        return $this->responder->success($this->response, $roster);
    }
}
