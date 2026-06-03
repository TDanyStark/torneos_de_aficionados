<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Application\Service\DeleteTournamentService;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/deletion-impact  (organizer OWNER or admin)
 *
 * Returns counts of what deleting this tournament would remove (teams, players,
 * matches, events) so the UI can warn the organizer before they confirm an
 * irreversible, destructive deletion.
 */
final class TournamentDeletionImpactAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private DeleteTournamentService $service
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

        $impact = $this->service->impact($id);

        return $this->responder->success($this->response, [
            'tournament_id' => $id,
            'impact'        => $impact,
        ]);
    }
}
