<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Fixture\RoundRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\Team\TeamRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/rounds/{id}/matches  (organizer)
 *
 * Creates a match manually under a round (jornada). {id} is the round id -> the
 * owning tournament is resolved via round -> stage and authorized inline.
 * REPEATED matches are allowed (no uniqueness index): the same pairing may be
 * created multiple times. Teams are nullable for TBD slots, but a team can never
 * play itself.
 */
final class CreateMatchAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private RoundRepository $rounds,
        private StageRepository $stages,
        private TournamentRepository $tournaments,
        private MatchRepository $matches,
        private TeamRepository $teams,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $roundId = (int) $this->arg('id', '0');

        $round = $this->rounds->findById($roundId);
        if ($round === null) {
            throw new NotFoundException('Fecha no encontrada.');
        }

        $stage = $this->stages->findById($round->stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $tournament = $this->tournaments->findById($stage->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $this->authorizer->assert($user, $tournament->id, ['organizer']);

        $body = $this->body();

        $homeTeamId = $this->resolveTeamId($body, 'home_team_id', $tournament->id);
        $awayTeamId = $this->resolveTeamId($body, 'away_team_id', $tournament->id);

        // A team can never play itself.
        if ($homeTeamId !== null && $awayTeamId !== null && $homeTeamId === $awayTeamId) {
            throw new ValidationException([
                'away_team_id' => 'Un equipo no puede enfrentarse a sí mismo.',
            ]);
        }

        // group_id: defaults to the round's group; explicit body value overrides.
        $groupId = $round->groupId;
        if (array_key_exists('group_id', $body) && $body['group_id'] !== null && $body['group_id'] !== '') {
            $groupId = (int) $body['group_id'];
            if ($groupId <= 0) {
                throw new ValidationException(['group_id' => 'El grupo indicado no es válido.']);
            }
        }

        // leg (positive int, default 1).
        $leg = 1;
        if (array_key_exists('leg', $body) && $body['leg'] !== null && $body['leg'] !== '') {
            $leg = (int) $body['leg'];
            if ($leg <= 0) {
                throw new ValidationException(['leg' => 'El número de vuelta debe ser un entero positivo.']);
            }
        }

        $data = [
            'tournament_id'   => $tournament->id,
            'stage_id'        => $stage->id,
            'round_id'        => $round->id,
            'group_id'        => $groupId,
            'home_team_id'    => $homeTeamId,
            'away_team_id'    => $awayTeamId,
            'leg'             => $leg,
            'venue'           => $this->resolveVenue($body),
            'scheduled_at'    => $this->resolveScheduledAt($body),
            'referee_user_id' => $this->resolveRefereeId($body),
            'status'          => 'scheduled',
        ];

        $match = $this->matches->create($data);

        return $this->responder->created($this->response, $match);
    }

    /**
     * Resolves a nullable team id and validates it belongs to this tournament.
     *
     * @param array<string,mixed> $body
     */
    private function resolveTeamId(array $body, string $key, int $tournamentId): ?int
    {
        if (!array_key_exists($key, $body) || $body[$key] === null || $body[$key] === '') {
            return null;
        }

        $teamId = (int) $body[$key];
        if ($teamId <= 0) {
            throw new ValidationException([$key => 'El equipo indicado no es válido.']);
        }

        $team = $this->teams->findById($teamId);
        if ($team === null || $team->tournamentId !== $tournamentId) {
            throw new ValidationException([$key => 'El equipo no pertenece a este torneo.']);
        }

        return $teamId;
    }

    /**
     * @param array<string,mixed> $body
     */
    private function resolveVenue(array $body): ?string
    {
        if (!array_key_exists('venue', $body)) {
            return null;
        }
        $venue = $body['venue'];
        if ($venue !== null && !is_string($venue)) {
            throw new ValidationException(['venue' => 'La sede debe ser texto.']);
        }
        if (is_string($venue)) {
            $venue = trim($venue);

            return $venue === '' ? null : $venue;
        }

        return null;
    }

    /**
     * @param array<string,mixed> $body
     */
    private function resolveScheduledAt(array $body): ?string
    {
        if (!array_key_exists('scheduled_at', $body)) {
            return null;
        }
        $scheduledAt = $body['scheduled_at'];
        if ($scheduledAt === null || $scheduledAt === '') {
            return null;
        }
        if (!is_string($scheduledAt)) {
            throw new ValidationException(['scheduled_at' => 'La fecha programada no es válida.']);
        }

        $value = str_replace('T', ' ', trim($scheduledAt));
        $timestamp = strtotime($value);
        if ($timestamp === false) {
            throw new ValidationException([
                'scheduled_at' => 'La fecha programada no es válida (formato YYYY-MM-DD HH:MM).',
            ]);
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    /**
     * @param array<string,mixed> $body
     */
    private function resolveRefereeId(array $body): ?int
    {
        if (!array_key_exists('referee_user_id', $body)
            || $body['referee_user_id'] === null
            || $body['referee_user_id'] === ''
        ) {
            return null;
        }

        $refereeId = (int) $body['referee_user_id'];
        if ($refereeId <= 0) {
            throw new ValidationException(['referee_user_id' => 'El árbitro indicado no es válido.']);
        }

        return $refereeId;
    }
}
