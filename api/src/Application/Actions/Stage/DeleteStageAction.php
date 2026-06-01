<?php

declare(strict_types=1);

namespace App\Application\Actions\Stage;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/stages/{id}  (organizer)
 * Removes a stage (cascades to its groups and advancement rules).
 */
final class DeleteStageAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
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

        $stage = $this->stages->findById($id);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $this->stages->delete($id);

        return $this->responder->noContent($this->response);
    }
}
