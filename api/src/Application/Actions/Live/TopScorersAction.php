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

        // Optional phase filter: ?stage_id[]=1&stage_id[]=2. Cast each to int,
        // keep only positive values, drop invalid silently. An empty set after
        // normalization means "all phases" (omit = all) — no 422 on bad input.
        $stageIds = [];
        foreach ((array) ($this->query()['stage_id'] ?? []) as $rawStageId) {
            $stageId = (int) $rawStageId;
            if ($stageId > 0) {
                $stageIds[] = $stageId;
            }
        }

        $items = $this->events->topScorers(
            $tournamentId,
            $pagination->limit(),
            $pagination->offset(),
            $stageIds
        );
        $total = $this->events->countTopScorers($tournamentId, $stageIds);

        return $this->responder->paginated(
            $this->response,
            $items,
            $pagination->meta($total)
        );
    }
}
