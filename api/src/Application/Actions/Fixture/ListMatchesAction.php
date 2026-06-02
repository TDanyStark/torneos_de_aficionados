<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/matches  (PUBLIC)
 *
 * Matches of a tournament with optional filters (round, group, status). Ordered
 * by round number ASC (calendar order).
 */
final class ListMatchesAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private MatchRepository $matches
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
        $filters = [
            'round'  => $query['round'] ?? null,
            'group'  => $query['group'] ?? null,
            'status' => $query['status'] ?? null,
        ];

        $matches = $this->matches->findByTournament($tournamentId, $filters);

        return $this->responder->success($this->response, $matches);
    }
}
