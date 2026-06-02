<?php

declare(strict_types=1);

namespace App\Application\Actions\Referee;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Referee\RefereeRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/referees  (PUBLIC)
 *
 * All referees of a tournament ordered by name ASC (per-tournament directory).
 */
final class ListRefereesAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private RefereeRepository $referees
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $tournamentId = (int) $this->arg('id', '0');

        if ($this->tournaments->findById($tournamentId) === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $referees = $this->referees->findByTournament($tournamentId);

        return $this->responder->success($this->response, $referees);
    }
}
