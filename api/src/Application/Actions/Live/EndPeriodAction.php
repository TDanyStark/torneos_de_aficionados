<?php

declare(strict_types=1);

namespace App\Application\Actions\Live;

use App\Application\Action\ApiAction;
use App\Application\Authorization\MatchRefereeAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Application\Service\EndPeriodService;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/matches/{id}/periods/end  (referee)
 *
 * Closes the active running period. Match status goes to 'paused'.
 */
final class EndPeriodAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private MatchRepository $matches,
        private MatchRefereeAuthorizer $authorizer,
        private EndPeriodService $service
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

        return $this->responder->success($this->response, $period);
    }
}
