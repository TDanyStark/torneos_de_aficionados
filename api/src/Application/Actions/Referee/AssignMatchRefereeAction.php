<?php

declare(strict_types=1);

namespace App\Application\Actions\Referee;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Referee\RefereeRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/matches/{id}/referee  (organizer)
 *
 * Assigns (or clears) the match-sheet referee. {id} is the match id -> the
 * owning tournament is resolved from the match and authorized inline. The
 * referee must belong to the match's tournament. This is DISTINCT from
 * referee_user_id (the live-control user).
 *
 * Body: { "referee_id": int|null }  (null clears the assignment)
 */
final class AssignMatchRefereeAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private MatchRepository $matches,
        private RefereeRepository $referees,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $matchId = (int) $this->arg('id', '0');

        $match = $this->matches->findById($matchId);
        if ($match === null) {
            throw new NotFoundException('Partido no encontrado.');
        }

        $this->authorizer->assert($user, $match->tournamentId, ['organizer']);

        $body = $this->body();

        if (!array_key_exists('referee_id', $body)) {
            throw new ValidationException([
                'referee_id' => 'El campo referee_id es obligatorio (entero o null).',
            ]);
        }

        $raw = $body['referee_id'];
        $refereeId = null;

        if ($raw !== null && $raw !== '') {
            $refereeId = (int) $raw;
            if ($refereeId <= 0) {
                throw new ValidationException(['referee_id' => 'El árbitro indicado no es válido.']);
            }

            $referee = $this->referees->findById($refereeId);
            if ($referee === null || $referee->tournamentId !== $match->tournamentId) {
                throw new ValidationException([
                    'referee_id' => 'El árbitro no pertenece al torneo de este partido.',
                ]);
            }
        }

        $updated = $this->matches->update($matchId, ['referee_id' => $refereeId]);

        return $this->responder->success($this->response, $updated);
    }
}
