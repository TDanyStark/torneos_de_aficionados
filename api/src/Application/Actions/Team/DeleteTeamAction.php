<?php

declare(strict_types=1);

namespace App\Application\Actions\Team;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Team\TeamRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/tournament-teams/{id}  (organizer only)
 * {id} is the team id -> tournament resolved via the team for the inline check.
 * Soft-deletes the team.
 */
final class DeleteTeamAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
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

        $team = $this->teams->findById($id);
        if ($team === null) {
            throw new NotFoundException('Equipo no encontrado.');
        }

        $this->authorizer->assert($user, $team->tournamentId, ['organizer']);

        $this->teams->softDelete($id);

        return $this->responder->noContent($this->response);
    }
}
