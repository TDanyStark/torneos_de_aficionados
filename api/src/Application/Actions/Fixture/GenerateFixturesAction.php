<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Application\Service\GenerateFixtureService;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Stage\StageRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/stages/{id}/generate-fixtures  (organizer)
 *
 * {id} is the stage id -> the owning tournament is resolved from the stage and
 * the inline TournamentAuthorizer guards organizer access. Refuses if fixtures
 * already exist (regenerate instead).
 */
final class GenerateFixturesAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private StageRepository $stages,
        private TournamentRepository $tournaments,
        private TournamentAuthorizer $authorizer,
        private GenerateFixtureService $service
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

        $tournament = $this->tournaments->findById($stage->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $this->authorizer->assert($user, $tournament->id, ['organizer']);

        $summary = $this->service->execute($tournament, $stage);

        return $this->responder->created($this->response, $summary);
    }
}
