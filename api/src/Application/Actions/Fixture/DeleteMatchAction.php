<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\Dto\ExistingMatch;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/matches/{id}  (organizer)
 *
 * Removes a manually-created (or generated) match. {id} is the match id -> the
 * owning tournament is resolved from the match and authorized inline. Refuses to
 * delete consolidated matches (live/paused/finished/walkover) to protect played
 * data.
 */
final class DeleteMatchAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private MatchRepository $matches,
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

        if (in_array($match->status, ExistingMatch::LOCKED_STATUSES, true)) {
            throw new ValidationException([
                'match' => 'No se puede eliminar un partido jugado o en curso.',
            ]);
        }

        $this->matches->delete($matchId);

        return $this->responder->noContent($this->response);
    }
}
