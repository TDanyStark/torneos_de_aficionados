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
 *
 * `?archivados=1` returns ONLY the archived (is_filed=1) tournaments — the
 * dashboard "Archivados" view. The default returns only active ones.
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

        $params = $this->request->getQueryParams();
        $filedOnly = !empty($params['archivados']);

        $items = $this->tournaments->findByOwner($user->id, $filedOnly);

        return $this->responder->success($this->response, $items);
    }
}
