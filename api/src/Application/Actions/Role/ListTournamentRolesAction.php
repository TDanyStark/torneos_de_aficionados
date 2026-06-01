<?php

declare(strict_types=1);

namespace App\Application\Actions\Role;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/roles  (organizer)
 * Lists all role assignments for a tournament, enriched with user name/email.
 */
final class ListTournamentRolesAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentUserRoleRepository $roles,
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

        $roles = $this->roles->findByTournament($tournamentId);

        return $this->responder->success($this->response, $roles);
    }
}
