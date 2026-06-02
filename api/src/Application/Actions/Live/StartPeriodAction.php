<?php

declare(strict_types=1);

namespace App\Application\Actions\Live;

use App\Application\Action\ApiAction;
use App\Application\Authorization\MatchRefereeAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Application\Service\StartPeriodService;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/matches/{id}/periods/start  (referee)
 *
 * Starts the next period of a match. Guarded by JwtAuthMiddleware (route) +
 * MatchRefereeAuthorizer (inline). Returns the created running period.
 */
final class StartPeriodAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private MatchRepository $matches,
        private MatchRefereeAuthorizer $authorizer,
        private StartPeriodService $service
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $matchId = (int) $this->arg('id', '0');
        $match = $this->matches->findById($matchId);
        if ($match === null) {
            throw new NotFoundException('Partido no encontrado.');
        }

        $this->authorizer->assert($user, $match);

        $period = $this->service->execute($match, $user->id);

        return $this->responder->created($this->response, $period);
    }
}
