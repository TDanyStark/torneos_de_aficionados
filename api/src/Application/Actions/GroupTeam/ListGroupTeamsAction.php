<?php

declare(strict_types=1);

namespace App\Application\Actions\GroupTeam;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Group\GroupRepository;
use App\Domain\GroupTeam\GroupTeamRepository;
use App\Domain\Shared\Exception\NotFoundException;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/groups/{id}/teams  (public)
 * Lists the teams assigned to a group, ordered by seed.
 */
final class ListGroupTeamsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private GroupTeamRepository $groupTeams,
        private GroupRepository $groups
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $groupId = (int) $this->arg('id', '0');

        if ($this->groups->findById($groupId) === null) {
            throw new NotFoundException('Grupo no encontrado.');
        }

        $items = $this->groupTeams->findByGroup($groupId);

        return $this->responder->success($this->response, $items);
    }
}
