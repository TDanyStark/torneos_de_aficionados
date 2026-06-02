<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\RoundRepository;
use App\Domain\Group\GroupRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/rounds/{id}  (organizer)
 *
 * Partial edit of a round (jornada). {id} is the round id -> the owning
 * tournament is resolved via round -> stage and the inline TournamentAuthorizer
 * guards organizer access. Only provided fields are touched.
 */
final class UpdateRoundAction extends ApiAction
{
    private const STATUSES = ['pending', 'in_progress', 'finished'];

    public function __construct(
        JsonResponder $responder,
        private RoundRepository $rounds,
        private StageRepository $stages,
        private GroupRepository $groups,
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

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $body = $this->body();
        $data = [];

        // number (positive int).
        if (array_key_exists('number', $body)) {
            $number = (int) $body['number'];
            if ($number <= 0) {
                throw new ValidationException(['number' => 'El número de fecha debe ser un entero positivo.']);
            }
            $data['number'] = $number;
        }

        // name (nullable string).
        if (array_key_exists('name', $body)) {
            $name = $body['name'];
            if ($name !== null && !is_string($name)) {
                throw new ValidationException(['name' => 'El nombre debe ser texto.']);
            }
            if (is_string($name)) {
                $name = trim($name);
                $data['name'] = $name === '' ? null : $name;
            } else {
                $data['name'] = null;
            }
        }

        // group_id (nullable int). When set, must belong to this round's stage.
        if (array_key_exists('group_id', $body)) {
            $rawGroup = $body['group_id'];
            if ($rawGroup === null || $rawGroup === '') {
                $data['group_id'] = null;
            } else {
                $groupId = (int) $rawGroup;
                if ($groupId <= 0) {
                    throw new ValidationException(['group_id' => 'El grupo indicado no es válido.']);
                }
                $group = $this->groups->findById($groupId);
                if ($group === null || $group->stageId !== $stage->id) {
                    throw new ValidationException(['group_id' => 'El grupo no pertenece a esta fase.']);
                }
                $data['group_id'] = $groupId;
            }
        }

        // scheduled_date (nullable DATE).
        if (array_key_exists('scheduled_date', $body)) {
            $data['scheduled_date'] = $this->normalizeDate($body['scheduled_date']);
        }

        // status (rounds enum).
        if (array_key_exists('status', $body) && $body['status'] !== null && $body['status'] !== '') {
            $status = (string) $body['status'];
            if (!in_array($status, self::STATUSES, true)) {
                throw new ValidationException([
                    'status' => 'Estado de fecha inválido (pending, in_progress, finished).',
                ]);
            }
            $data['status'] = $status;
        }

        if ($data === []) {
            throw new ValidationException([
                'round' => 'No hay campos editables en la solicitud (number, name, group_id, scheduled_date, status).',
            ]);
        }

        $updated = $this->rounds->update($roundId, $data);

        return $this->responder->success($this->response, $updated);
    }

    /**
     * @param mixed $value
     */
    private function normalizeDate($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_string($value)) {
            throw new ValidationException(['scheduled_date' => 'La fecha no es válida.']);
        }

        $timestamp = strtotime(trim($value));
        if ($timestamp === false) {
            throw new ValidationException([
                'scheduled_date' => 'La fecha no es válida (formato YYYY-MM-DD).',
            ]);
        }

        return date('Y-m-d', $timestamp);
    }
}
