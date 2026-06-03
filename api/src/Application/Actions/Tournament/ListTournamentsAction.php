<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Pagination;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments  (public)
 * Paginated catalog of PUBLIC tournaments only (is_public = 1, not archived).
 * Private tournaments are reachable solely via their shareable link (/t/{slug}).
 * Filters: sport, status, q (name search). Orders by updated_at DESC.
 */
final class ListTournamentsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $query = $this->query();
        $pagination = Pagination::fromQuery($query);

        $filters = [
            'sport_id' => isset($query['sport']) && $query['sport'] !== '' ? (int) $query['sport'] : null,
            'status'   => isset($query['status']) && $query['status'] !== '' ? (string) $query['status'] : null,
            'q'        => isset($query['q']) && $query['q'] !== '' ? trim((string) $query['q']) : null,
            // Public catalog: only listed (is_public) tournaments, never archived.
            'public_only' => true,
        ];

        $items = $this->tournaments->paginate($pagination, $filters);
        $total = $this->tournaments->countAll($filters);

        return $this->responder->paginated(
            $this->response,
            $items,
            $pagination->meta($total)
        );
    }
}
