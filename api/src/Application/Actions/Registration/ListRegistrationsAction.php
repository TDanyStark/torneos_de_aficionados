<?php

declare(strict_types=1);

namespace App\Application\Actions\Registration;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Pagination;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/registrations  (organizer)
 * Paginated inbox. Pending/submitted first, then updated_at DESC. {id} is the
 * tournament id -> RoleMiddleware already guarded organizer.
 */
final class ListRegistrationsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private RegistrationRepository $registrations,
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

        $items = $this->registrations->paginateByTournament($tournamentId, $pagination);
        $total = $this->registrations->countByTournament($tournamentId);

        return $this->responder->paginated(
            $this->response,
            $items,
            $pagination->meta($total)
        );
    }
}
