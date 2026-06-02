<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/mine  (auth required)
 * Full tournament entities owned by the authenticated user. Replaces a fragile
 * per-id fetch loop on the client. Plain array, newest first.
 */
final class ListMyTournamentsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $items = $this->tournaments->findByOwner($user->id);

        return $this->responder->success($this->response, $items);
    }
}
