<?php

declare(strict_types=1);

namespace App\Application\Actions\Group;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Application\Service\DistributeGroupsService;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/stages/{id}/groups/distribute  (organizer)
 *
 * {id} is the stage id -> the owning tournament is resolved from the stage and
 * the inline TournamentAuthorizer guards organizer access (mirrors
 * GenerateFixturesAction). Creates N groups and round-robin distributes the
 * tournament's approved teams. Destructive: replaces any existing groups.
 *
 * Body: { "count": int (1..26, required), "random": bool (optional, default true) }
 */
final class DistributeGroupsAction extends ApiAction
{
    /** Cap so group names A..Z stay valid (chr(65+i)). */
    private const MAX_GROUPS = 26;

    public function __construct(
        JsonResponder $responder,
        private StageRepository $stages,
        private TournamentRepository $tournaments,
        private TournamentAuthorizer $authorizer,
        private DistributeGroupsService $service
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

        $body = $this->body();

        $count = isset($body['count']) ? (int) $body['count'] : 0;
        if ($count < 1 || $count > self::MAX_GROUPS) {
            throw new ValidationException([
                'count' => 'El número de grupos debe estar entre 1 y ' . self::MAX_GROUPS . '.',
            ]);
        }

        $random = array_key_exists('random', $body) ? (bool) $body['random'] : true;

        $summary = $this->service->execute($tournament, $stage, $count, $random);

        return $this->responder->created($this->response, $summary);
    }
}
