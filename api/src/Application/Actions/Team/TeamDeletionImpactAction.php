<?php

declare(strict_types=1);

namespace App\Application\Actions\Team;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Application\Service\DeleteTeamService;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Team\TeamRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournament-teams/{id}/deletion-impact  (organizer only)
 *
 * Returns counts of what deleting this team would remove (matches, goals,
 * roster players, group placements) so the UI can warn the organizer before
 * they confirm a destructive, irreversible deletion.
 */
final class TeamDeletionImpactAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TeamRepository $teams,
        private DeleteTeamService $service,
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

        $impact = $this->service->impact($id);

        return $this->responder->success($this->response, [
            'team_id' => $id,
            'status'  => $team->status,
            'impact'  => $impact,
        ]);
    }
}
