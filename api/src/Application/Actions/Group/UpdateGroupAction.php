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
 * PUT /api/v1/groups/{id}  (organizer)
 */
final class UpdateGroupAction extends ApiAction
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

        $body = $this->body();
        $data = [];
        $errors = [];

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if ($name === '') {
                $errors['name'] = 'El nombre del grupo es obligatorio.';
            } else {
                $data['name'] = $name;
            }
        }
        if (array_key_exists('position', $body)) {
            $data['position'] = max(1, (int) $body['position']);
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $updated = $this->groups->update($id, $data);

        return $this->responder->success($this->response, $updated);
    }
}
