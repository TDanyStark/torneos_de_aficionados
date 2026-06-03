<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PATCH /api/v1/tournaments/{id}/filed  (organizer OWNER or admin)
 * Body: { "filed": bool }
 *
 * Archives ($filed=true) or restores ($filed=false) a tournament by toggling
 * its is_filed flag. Non-destructive and independent of status: archived
 * tournaments simply move to the dashboard "Archivados" view.
 *
 * Response 200: { "tournament_id": int, "is_filed": bool }
 */
final class SetTournamentFiledAction extends ApiAction
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

        $id = (int) $this->arg('id', '0');

        $tournament = $this->tournaments->findById($id);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        if (!$user->isAdmin && $tournament->ownerUserId !== $user->id) {
            throw new ForbiddenException('Solo el organizador propietario puede archivar este torneo.');
        }

        $body = $this->body();
        $filed = !empty($body['filed']);

        $this->tournaments->setFiled($id, $filed);

        return $this->responder->success($this->response, [
            'tournament_id' => $id,
            'is_filed'      => $filed,
        ]);
    }
}
