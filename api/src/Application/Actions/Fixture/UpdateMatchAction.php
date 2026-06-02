<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/matches/{id}  (organizer)
 *
 * Edits match METADATA only: venue, scheduled_at, referee_user_id. Scores are
 * NOT editable here — score consolidation belongs to Fase 5. {id} is the match
 * id -> the owning tournament is resolved from the match and authorized inline.
 */
final class UpdateMatchAction extends ApiAction
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

        $body = $this->body();
        $data = [];

        // venue (nullable string).
        if (array_key_exists('venue', $body)) {
            $venue = $body['venue'];
            if ($venue !== null && !is_string($venue)) {
                throw new ValidationException(['venue' => 'La sede debe ser texto.']);
            }
            if (is_string($venue)) {
                $venue = trim($venue);
                $data['venue'] = $venue === '' ? null : $venue;
            } else {
                $data['venue'] = null;
            }
        }

        // scheduled_at (nullable datetime "Y-m-d H:i:s" or ISO).
        if (array_key_exists('scheduled_at', $body)) {
            $scheduledAt = $body['scheduled_at'];
            if ($scheduledAt === null || $scheduledAt === '') {
                $data['scheduled_at'] = null;
            } else {
                if (!is_string($scheduledAt)) {
                    throw new ValidationException([
                        'scheduled_at' => 'La fecha programada no es válida.',
                    ]);
                }
                $normalized = $this->normalizeDateTime($scheduledAt);
                if ($normalized === null) {
                    throw new ValidationException([
                        'scheduled_at' => 'La fecha programada no es válida (formato YYYY-MM-DD HH:MM).',
                    ]);
                }
                $data['scheduled_at'] = $normalized;
            }
        }

        // referee_user_id (nullable int).
        if (array_key_exists('referee_user_id', $body)) {
            $referee = $body['referee_user_id'];
            if ($referee === null || $referee === '') {
                $data['referee_user_id'] = null;
            } else {
                $refereeId = (int) $referee;
                if ($refereeId <= 0) {
                    throw new ValidationException([
                        'referee_user_id' => 'El árbitro indicado no es válido.',
                    ]);
                }
                $data['referee_user_id'] = $refereeId;
            }
        }

        if ($data === []) {
            throw new ValidationException([
                'match' => 'No hay campos editables en la solicitud (venue, scheduled_at, referee_user_id).',
            ]);
        }

        $updated = $this->matches->update($matchId, $data);

        return $this->responder->success($this->response, $updated);
    }

    /**
     * Accepts "Y-m-d H:i", "Y-m-d H:i:s" and ISO "Y-m-dTH:i[:s]"; returns a
     * MySQL DATETIME string, or null when unparseable.
     */
    private function normalizeDateTime(string $value): ?string
    {
        $value = trim($value);
        $value = str_replace('T', ' ', $value);

        $timestamp = strtotime($value);
        if ($timestamp === false) {
            return null;
        }

        return date('Y-m-d H:i:s', $timestamp);
    }
}
