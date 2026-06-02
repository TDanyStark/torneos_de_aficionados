<?php

declare(strict_types=1);

namespace App\Application\Actions\Player;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Player\PlayerRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/players/lookup?document_id=...  (organizer|delegate)
 * Resolves the organizer from the tournament owner (NOT the requester) and
 * searches that organizer's pool by cédula. Returns the player when found, or a
 * 404 so the frontend prompts for full data. {id} is the tournament id ->
 * RoleMiddleware already guarded organizer|delegate.
 */
final class LookupPlayerAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private PlayerRepository $players,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $tournamentId = (int) $this->arg('id', '0');

        $tournament = $this->tournaments->findById($tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $query = $this->query();
        $documentId = isset($query['document_id']) ? trim((string) $query['document_id']) : '';
        if ($documentId === '') {
            throw new ValidationException(['document_id' => 'La cédula es obligatoria.']);
        }

        // Pool ownership = tournament owner, not the requester.
        $player = $this->players->findByOrganizerAndDocument($tournament->ownerUserId, $documentId);
        if ($player === null) {
            throw new NotFoundException('No existe un jugador con esa cédula en el pool del organizador.');
        }

        return $this->responder->success($this->response, $player);
    }
}
