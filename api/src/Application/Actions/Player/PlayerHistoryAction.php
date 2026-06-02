<?php

declare(strict_types=1);

namespace App\Application\Actions\Player;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Player\PlayerRepository;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/players/{id}/history  (organizer owner only)
 * Derives the player's history (tournaments, teams, goals/cards) restricted to
 * the owning organizer. Goals/cards are 0 until Fase 4 adds match_events. Other
 * organizers cannot see another pool's player even if it's the same person.
 */
final class PlayerHistoryAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private PlayerRepository $players
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $player = $this->players->findById($id);
        if ($player === null) {
            throw new NotFoundException('Jugador no encontrado.');
        }

        // Isolation: only the owning organizer (or an admin) can view the history.
        if (!$user->isAdmin && $player->organizerUserId !== $user->id) {
            throw new ForbiddenException('No tienes permiso para ver el historial de este jugador.');
        }

        $history = $this->players->historyForOrganizer($player->id, $player->organizerUserId);

        return $this->responder->success($this->response, [
            'player'  => $player,
            'history' => $history,
            'note'    => 'Goles y tarjetas estarán disponibles cuando Fase 4 registre los eventos de partido.',
        ]);
    }
}
