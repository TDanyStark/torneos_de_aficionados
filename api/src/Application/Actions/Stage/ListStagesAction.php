<?php

declare(strict_types=1);

namespace App\Application\Actions\Stage;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Stage\StageRepository;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/stages  (public)
 * Lists a tournament's stages ordered by position.
 */
final class ListStagesAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private StageRepository $stages,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $tournamentId = (int) $this->arg('id', '0');

        if ($this->tournaments->findById($tournamentId) === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $stages = $this->stages->findByTournament($tournamentId);

        return $this->responder->success($this->response, $stages);
    }
}
