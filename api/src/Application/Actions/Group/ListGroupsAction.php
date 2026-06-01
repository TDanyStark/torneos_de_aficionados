<?php

declare(strict_types=1);

namespace App\Application\Actions\Group;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Group\GroupRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Stage\StageRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/stages/{id}/groups  (public)
 * Lists the groups of a stage ordered by position.
 */
final class ListGroupsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private GroupRepository $groups,
        private StageRepository $stages
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $stageId = (int) $this->arg('id', '0');

        if ($this->stages->findById($stageId) === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $groups = $this->groups->findByStage($stageId);

        return $this->responder->success($this->response, $groups);
    }
}
