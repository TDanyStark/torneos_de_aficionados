<?php

declare(strict_types=1);

namespace App\Application\Actions\Group;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Group\GroupRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/groups/{id}  (organizer)
 */
final class DeleteGroupAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
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

        $group = $this->groups->findById($id);
        if ($group === null) {
            throw new NotFoundException('Grupo no encontrado.');
        }

        $stage = $this->stages->findById($group->stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $this->groups->delete($id);

        return $this->responder->noContent($this->response);
    }
}
