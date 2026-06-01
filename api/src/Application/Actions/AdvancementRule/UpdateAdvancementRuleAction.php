<?php

declare(strict_types=1);

namespace App\Application\Actions\AdvancementRule;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\AdvancementRule\AdvancementRuleRepository;
use App\Domain\Group\GroupRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/advancement-rules/{id}  (organizer)
 */
final class UpdateAdvancementRuleAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private AdvancementRuleRepository $rules,
        private StageRepository $stages,
        private GroupRepository $groups,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $rule = $this->rules->findById($id);
        if ($rule === null) {
            throw new NotFoundException('Regla de avance no encontrada.');
        }

        $stage = $this->stages->findById($rule->stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $body = $this->body();
        $data = [];
        $errors = [];

        if (array_key_exists('group_id', $body)) {
            $groupId = $body['group_id'] !== null && $body['group_id'] !== '' ? (int) $body['group_id'] : null;
            if ($groupId !== null) {
                $group = $this->groups->findById($groupId);
                if ($group === null || $group->stageId !== $rule->stageId) {
                    $errors['group_id'] = 'El grupo no pertenece a esta fase.';
                }
            }
            $data['group_id'] = $groupId;
        }
        if (array_key_exists('qualifies_count', $body)) {
            $data['qualifies_count'] = $body['qualifies_count'] !== null && $body['qualifies_count'] !== ''
                ? (int) $body['qualifies_count'] : null;
        }
        if (array_key_exists('eliminates_count', $body)) {
            $data['eliminates_count'] = $body['eliminates_count'] !== null && $body['eliminates_count'] !== ''
                ? (int) $body['eliminates_count'] : null;
        }
        if (array_key_exists('target_stage_id', $body)) {
            $targetStageId = $body['target_stage_id'] !== null && $body['target_stage_id'] !== ''
                ? (int) $body['target_stage_id'] : null;
            if ($targetStageId !== null) {
                $target = $this->stages->findById($targetStageId);
                if ($target === null || $target->tournamentId !== $stage->tournamentId) {
                    $errors['target_stage_id'] = 'La fase destino no pertenece a este torneo.';
                }
            }
            $data['target_stage_id'] = $targetStageId;
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $updated = $this->rules->update($id, $data);

        return $this->responder->success($this->response, $updated);
    }
}
