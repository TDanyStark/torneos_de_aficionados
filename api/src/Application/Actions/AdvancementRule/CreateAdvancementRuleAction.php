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
 * POST /api/v1/stages/{id}/advancement-rules  (organizer)
 * Defines how teams advance out of a stage (or one of its groups) into a target
 * stage.
 */
final class CreateAdvancementRuleAction extends ApiAction
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

        $stageId = (int) $this->arg('id', '0');

        $stage = $this->stages->findById($stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $body = $this->body();

        $groupId         = isset($body['group_id']) && $body['group_id'] !== '' ? (int) $body['group_id'] : null;
        $qualifiesCount  = isset($body['qualifies_count']) && $body['qualifies_count'] !== ''
            ? (int) $body['qualifies_count'] : null;
        $eliminatesCount = isset($body['eliminates_count']) && $body['eliminates_count'] !== ''
            ? (int) $body['eliminates_count'] : null;
        $targetStageId   = isset($body['target_stage_id']) && $body['target_stage_id'] !== ''
            ? (int) $body['target_stage_id'] : null;

        $errors = [];
        if ($qualifiesCount === null && $eliminatesCount === null) {
            $errors['qualifies_count'] = 'Debes indicar cuántos clasifican o cuántos se eliminan.';
        }

        // Group, if given, must belong to this stage.
        if ($groupId !== null) {
            $group = $this->groups->findById($groupId);
            if ($group === null || $group->stageId !== $stageId) {
                $errors['group_id'] = 'El grupo no pertenece a esta fase.';
            }
        }

        // Target stage, if given, must belong to the same tournament.
        if ($targetStageId !== null) {
            $target = $this->stages->findById($targetStageId);
            if ($target === null || $target->tournamentId !== $stage->tournamentId) {
                $errors['target_stage_id'] = 'La fase destino no pertenece a este torneo.';
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $rule = $this->rules->create($stageId, [
            'group_id'         => $groupId,
            'qualifies_count'  => $qualifiesCount,
            'eliminates_count' => $eliminatesCount,
            'target_stage_id'  => $targetStageId,
        ]);

        return $this->responder->created($this->response, $rule);
    }
}
