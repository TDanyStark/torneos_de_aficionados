<?php

declare(strict_types=1);

namespace App\Application\Actions\Live;

use App\Application\Action\ApiAction;
use App\Application\Authorization\MatchRefereeAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchEventRepository;
use App\Domain\Fixture\MatchPeriodRepository;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/matches/{id}/events  (referee)
 *
 * Records a live event (goal | own_goal | yellow_card | red_card). Validations:
 *  - there must be an active running period,
 *  - team_id must be the match's home or away team,
 *  - player must belong to that team's roster (team_players).
 * The event is bound to the active period and the recording user.
 */
final class RecordEventAction extends ApiAction
{
    private const ALLOWED_TYPES = ['goal', 'own_goal', 'yellow_card', 'red_card'];

    public function __construct(
        JsonResponder $responder,
        private MatchRepository $matches,
        private MatchPeriodRepository $periods,
        private MatchEventRepository $events,
        private TeamPlayerRepository $teamPlayers,
        private MatchRefereeAuthorizer $authorizer
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

        $this->authorizer->assert($user, $match);

        $body = $this->body();

        // type
        $type = is_string($body['type'] ?? null) ? trim((string) $body['type']) : '';
        if (!in_array($type, self::ALLOWED_TYPES, true)) {
            throw new ValidationException([
                'type' => 'El tipo de evento no es válido (goal, own_goal, yellow_card, red_card).',
            ]);
        }

        // Active running period is mandatory for any goal/card event.
        $active = $this->periods->findActiveByMatch($match->id);
        if ($active === null) {
            throw new ValidationException([
                'period' => 'No hay período activo para registrar el evento.',
            ]);
        }

        // team_id must be the home or away team of the match.
        $teamId = isset($body['team_id']) && $body['team_id'] !== null && $body['team_id'] !== ''
            ? (int) $body['team_id']
            : 0;
        if ($teamId <= 0) {
            throw new ValidationException(['team_id' => 'El equipo es obligatorio.']);
        }
        if ($teamId !== $match->homeTeamId && $teamId !== $match->awayTeamId) {
            throw new ValidationException([
                'team_id' => 'El equipo no participa en este partido.',
            ]);
        }

        // player_id must belong to that team's roster.
        $playerId = isset($body['player_id']) && $body['player_id'] !== null && $body['player_id'] !== ''
            ? (int) $body['player_id']
            : 0;
        if ($playerId <= 0) {
            throw new ValidationException(['player_id' => 'El jugador es obligatorio.']);
        }
        if (!$this->teamPlayers->existsForTeamAndPlayer($teamId, $playerId)) {
            throw new ValidationException([
                'player_id' => 'El jugador no pertenece al equipo indicado.',
            ]);
        }

        // minute (optional, non-negative).
        $minute = null;
        if (isset($body['minute']) && $body['minute'] !== null && $body['minute'] !== '') {
            $minute = (int) $body['minute'];
            if ($minute < 0) {
                throw new ValidationException(['minute' => 'El minuto no puede ser negativo.']);
            }
        }

        $event = $this->events->create([
            'match_id'           => $match->id,
            'match_period_id'    => $active->id,
            'type'               => $type,
            'team_id'            => $teamId,
            'player_id'          => $playerId,
            'minute'             => $minute,
            'created_by_user_id' => $user->id,
        ]);

        return $this->responder->created($this->response, $event);
    }
}
