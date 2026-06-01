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
 * DELETE /api/v1/tournaments/{id}  (organizer OWNER only)
 * Soft-deletes the tournament (sets deleted_at).
 */
final class DeleteTournamentAction extends ApiAction
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
            throw new ForbiddenException('Solo el organizador propietario puede eliminar este torneo.');
        }

        $this->tournaments->softDelete($id);

        return $this->responder->noContent($this->response);
    }
}
