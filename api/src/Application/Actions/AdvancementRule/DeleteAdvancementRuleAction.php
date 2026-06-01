<?php

declare(strict_types=1);

namespace App\Application\Actions\AdvancementRule;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\AdvancementRule\AdvancementRuleRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/advancement-rules/{id}  (organizer)
 */
final class DeleteAdvancementRuleAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private AdvancementRuleRepository $rules,
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

        $rule = $this->rules->findById($id);
        if ($rule === null) {
            throw new NotFoundException('Regla de avance no encontrada.');
        }

        $stage = $this->stages->findById($rule->stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $this->rules->delete($id);

        return $this->responder->noContent($this->response);
    }
}
