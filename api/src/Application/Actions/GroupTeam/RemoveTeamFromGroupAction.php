<?php

declare(strict_types=1);

namespace App\Application\Actions\GroupTeam;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Group\GroupRepository;
use App\Domain\GroupTeam\GroupTeamRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/group-teams/{id}  (organizer)
 * Removes a team from a group. {id} is the group_teams id -> tournament resolved
 * via group_team -> group -> stage for the inline check.
 */
final class RemoveTeamFromGroupAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private GroupTeamRepository $groupTeams,
        private GroupRepository $groups,
        private StageRepository $stages,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $groupTeam = $this->groupTeams->findById($id);
        if ($groupTeam === null) {
            throw new NotFoundException('Asignación de equipo no encontrada.');
        }

        $group = $this->groups->findById($groupTeam->groupId);
        if ($group === null) {
            throw new NotFoundException('Grupo no encontrado.');
        }

        $stage = $this->stages->findById($group->stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $this->groupTeams->delete($id);

        return $this->responder->noContent($this->response);
    }
}
