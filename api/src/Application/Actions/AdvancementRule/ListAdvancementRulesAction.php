<?php

declare(strict_types=1);

namespace App\Application\Actions\AdvancementRule;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\AdvancementRule\AdvancementRuleRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Stage\StageRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/stages/{id}/advancement-rules  (public)
 * Lists the advancement rules defined for a stage.
 */
final class ListAdvancementRulesAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private AdvancementRuleRepository $rules,
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

        $rules = $this->rules->findByStage($stageId);

        return $this->responder->success($this->response, $rules);
    }
}
