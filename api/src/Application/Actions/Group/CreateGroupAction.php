<?php

declare(strict_types=1);

namespace App\Application\Actions\Group;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Group\GroupRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/stages/{id}/groups  (organizer)
 * Creates a group within a stage. Team membership arrives in Phase 3.
 */
final class CreateGroupAction extends ApiAction
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

        $stageId = (int) $this->arg('id', '0');

        $stage = $this->stages->findById($stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $body = $this->body();

        $name     = trim((string) ($body['name'] ?? ''));
        $position = isset($body['position']) ? (int) $body['position'] : 1;

        if ($name === '') {
            throw new ValidationException(['name' => 'El nombre del grupo es obligatorio.']);
        }

        $group = $this->groups->create($stageId, [
            'name'     => $name,
            'position' => max(1, $position),
        ]);

        return $this->responder->created($this->response, $group);
    }
}
