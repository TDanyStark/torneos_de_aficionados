<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\RoundRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/rounds  (PUBLIC)
 *
 * All rounds of a tournament ordered by number ASC (natural calendar order).
 */
final class ListRoundsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private RoundRepository $rounds
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

        $rounds = $this->rounds->findByTournament($tournamentId);

        return $this->responder->success($this->response, $rounds);
    }
}
