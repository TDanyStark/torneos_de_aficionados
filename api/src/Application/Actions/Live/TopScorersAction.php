<?php

declare(strict_types=1);

namespace App\Application\Actions\Live;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchEventRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Pagination;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/top-scorers  (PUBLIC, paginated)
 *
 * Goals per player derived from match_events (own_goal excluded). Ordered by
 * goals DESC. Each row: player_id, player_name, team_id, team_name, goals.
 */
final class TopScorersAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private MatchEventRepository $events,
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

        $pagination = Pagination::fromQuery($this->query());

        $items = $this->events->topScorers(
            $tournamentId,
            $pagination->limit(),
            $pagination->offset()
        );
        $total = $this->events->countTopScorers($tournamentId);

        return $this->responder->paginated(
            $this->response,
            $items,
            $pagination->meta($total)
        );
    }
}
