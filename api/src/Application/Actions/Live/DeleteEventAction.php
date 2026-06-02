<?php

declare(strict_types=1);

namespace App\Application\Actions\Live;

use App\Application\Action\ApiAction;
use App\Application\Authorization\MatchRefereeAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchEventRepository;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/match-events/{id}  (referee)
 *
 * Corrects a mis-recorded event by deleting it. Only goal/card events may be
 * deleted here — period markers (period_start/period_end) are managed by the
 * start/end period endpoints, not by this correction endpoint. {id} is the
 * event id; the owning match is resolved and authorized inline.
 */
final class DeleteEventAction extends ApiAction
{
    private const DELETABLE_TYPES = ['goal', 'own_goal', 'yellow_card', 'red_card'];

    public function __construct(
        JsonResponder $responder,
        private MatchEventRepository $events,
        private MatchRepository $matches,
        private MatchRefereeAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $eventId = (int) $this->arg('id', '0');
        $event = $this->events->findById($eventId);
        if ($event === null) {
            throw new NotFoundException('Evento no encontrado.');
        }

        $match = $this->matches->findById($event->matchId);
        if ($match === null) {
            throw new NotFoundException('Partido no encontrado.');
        }

        $this->authorizer->assert($user, $match);

        if (!in_array($event->type, self::DELETABLE_TYPES, true)) {
            throw new ValidationException([
                'type' => 'Solo se pueden eliminar eventos de gol o tarjeta.',
            ]);
        }

        $this->events->delete($eventId);

        return $this->responder->noContent($this->response);
    }
}
