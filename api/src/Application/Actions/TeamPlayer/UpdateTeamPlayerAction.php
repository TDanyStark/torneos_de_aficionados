<?php

declare(strict_types=1);

namespace App\Application\Actions\TeamPlayer;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Team\TeamRepository;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/team-players/{id}  (organizer|delegate)
 * Updates roster data (shirt number, position, captain/delegate flags, status).
 * {id} is the roster entry id -> resolved team -> tournament for the inline check.
 *
 * Player moderation: only the organizer may reject a roster entry (status =
 * 'rejected', requires a reason) or re-accept it (status = 'active', which
 * clears the reason). Delegates can edit roster data but not moderate.
 */
final class UpdateTeamPlayerAction extends ApiAction
{
    private const STATUSES = ['active', 'inactive', 'rejected'];

    public function __construct(
        JsonResponder $responder,
        private TeamPlayerRepository $teamPlayers,
        private TeamRepository $teams,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $teamPlayer = $this->teamPlayers->findById($id);
        if ($teamPlayer === null) {
            throw new NotFoundException('Jugador de la plantilla no encontrado.');
        }

        $team = $this->teams->findById($teamPlayer->tournamentTeamId);
        if ($team === null) {
            throw new NotFoundException('Equipo no encontrado.');
        }

        $this->authorizer->assert($user, $team->tournamentId, ['organizer', 'delegate']);

        $body = $this->body();
        $data = [];
        $errors = [];

        if (array_key_exists('shirt_number', $body)) {
            if ($body['shirt_number'] === null || $body['shirt_number'] === '') {
                $data['shirt_number'] = null;
            } else {
                $shirtNumber = (int) $body['shirt_number'];
                if ($this->teamPlayers->shirtNumberTaken($teamPlayer->tournamentTeamId, $shirtNumber, $id)) {
                    $errors['shirt_number'] = 'El dorsal ya está asignado en este equipo.';
                } else {
                    $data['shirt_number'] = $shirtNumber;
                }
            }
        }
        if (array_key_exists('position', $body)) {
            $position = trim((string) $body['position']);
            $data['position'] = $position !== '' ? $position : null;
        }
        if (array_key_exists('is_captain', $body)) {
            $data['is_captain'] = !empty($body['is_captain']);
        }
        if (array_key_exists('is_delegate', $body)) {
            $data['is_delegate'] = !empty($body['is_delegate']);
        }
        if (array_key_exists('status', $body)) {
            $status = (string) $body['status'];
            if (!in_array($status, self::STATUSES, true)) {
                $errors['status'] = 'El estado del jugador no es válido.';
            } else {
                // Moderation (reject / re-accept) is organizer-only. A delegate
                // editing other roster data never touches status, so we only
                // gate when the request actually changes moderation state.
                $isModeration = $status === 'rejected'
                    || ($status === 'active' && $teamPlayer->status === 'rejected');
                if ($isModeration) {
                    $this->authorizer->assert($user, $team->tournamentId, ['organizer']);
                }

                $data['status'] = $status;

                if ($status === 'rejected') {
                    $reason = isset($body['rejection_reason'])
                        ? trim((string) $body['rejection_reason'])
                        : '';
                    if ($reason === '') {
                        $errors['rejection_reason'] = 'Debes indicar el motivo del rechazo.';
                    } elseif (mb_strlen($reason) > 255) {
                        $errors['rejection_reason'] = 'El motivo no puede superar 255 caracteres.';
                    } else {
                        $data['rejection_reason'] = $reason;
                        $data['rejected_at'] = date('Y-m-d H:i:s');
                    }
                } else {
                    // Leaving the rejected state clears the moderation metadata.
                    $data['rejection_reason'] = null;
                    $data['rejected_at'] = null;
                }
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $updated = $this->teamPlayers->update($id, $data);

        return $this->responder->success($this->response, $updated);
    }
}
