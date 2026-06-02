<?php

declare(strict_types=1);

namespace App\Application\Actions\Team;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Pagination;
use App\Domain\Team\TeamRepository;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/teams  (public)
 * Paginated team listing for a tournament. Filters: status, q (name search).
 */
final class ListTeamsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TeamRepository $teams,
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

        $query = $this->query();
        $pagination = Pagination::fromQuery($query);

        $filters = [
            'status' => isset($query['status']) && $query['status'] !== '' ? (string) $query['status'] : null,
            'q'      => isset($query['q']) && $query['q'] !== '' ? trim((string) $query['q']) : null,
        ];

        $items = $this->teams->paginateByTournament($tournamentId, $pagination, $filters);
        $total = $this->teams->countByTournament($tournamentId, $filters);

        return $this->responder->paginated(
            $this->response,
            $items,
            $pagination->meta($total)
        );
    }
}
