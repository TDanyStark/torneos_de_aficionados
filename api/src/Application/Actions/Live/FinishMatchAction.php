<?php

declare(strict_types=1);

namespace App\Application\Actions\Live;

use App\Application\Action\ApiAction;
use App\Application\Authorization\MatchRefereeAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Application\Service\FinishMatchService;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/matches/{id}/finish  (referee)
 *
 * Finalizes a match: auto-closes any running period, consolidates the final
 * score from the event stream and sets status 'finished'. Returns the
 * consolidated match (home_score/away_score/winner_team_id).
 */
final class FinishMatchAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private MatchRepository $matches,
        private MatchRefereeAuthorizer $authorizer,
        private FinishMatchService $service
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

        $finished = $this->service->execute($match, $user->id);

        return $this->responder->success($this->response, $finished);
    }
}
