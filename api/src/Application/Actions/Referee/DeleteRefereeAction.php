<?php

declare(strict_types=1);

namespace App\Application\Actions\Referee;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Referee\RefereeRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/referees/{id}  (organizer)
 *
 * Removes a referee from the directory. {id} is the referee id -> the owning
 * tournament is resolved from the referee and authorized inline. Any match
 * referencing this referee on its sheet (matches.referee_id) is auto-nulled by
 * the ON DELETE SET NULL FK.
 */
final class DeleteRefereeAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private RefereeRepository $referees,
        private TournamentRepository $tournaments,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $referee = $this->referees->findById($id);
        if ($referee === null) {
            throw new NotFoundException('Árbitro no encontrado.');
        }

        $tournament = $this->tournaments->findById($referee->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $this->authorizer->assert($user, $tournament->id, ['organizer']);

        $this->referees->delete($id);

        return $this->responder->noContent($this->response);
    }
}
