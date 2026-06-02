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
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/stages/{id}/rounds  (organizer)
 *
 * Creates a round (jornada) manually. {id} is the stage id -> the owning
 * tournament is resolved from the stage and the inline TournamentAuthorizer
 * guards organizer access. `number` auto-increments (max + 1) when omitted;
 * duplicates are allowed (no unique index) but the friendly default avoids them.
 */
final class CreateRoundAction extends ApiAction
{
    /** Calendar order = number ASC. */
    private const STATUSES = ['pending', 'in_progress', 'finished'];

    public function __construct(
        JsonResponder $responder,
        private StageRepository $stages,
        private TournamentRepository $tournaments,
        private RoundRepository $rounds,
        private GroupRepository $groups,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $stageId = (int) $this->arg('id', '0');

        $stage = $this->stages->findById($stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $tournament = $this->tournaments->findById($stage->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $this->authorizer->assert($user, $tournament->id, ['organizer']);

        $body = $this->body();
        $data = ['stage_id' => $stage->id];

        // number: auto-assign (max + 1) when omitted; positive int otherwise.
        if (array_key_exists('number', $body) && $body['number'] !== null && $body['number'] !== '') {
            $number = (int) $body['number'];
            if ($number <= 0) {
                throw new ValidationException(['number' => 'El número de fecha debe ser un entero positivo.']);
            }
            $data['number'] = $number;
        } else {
            $data['number'] = $this->nextNumber($stage->id);
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

        // group_id (nullable int). When provided, must belong to this stage.
        if (array_key_exists('group_id', $body) && $body['group_id'] !== null && $body['group_id'] !== '') {
            $groupId = (int) $body['group_id'];
            if ($groupId <= 0) {
                throw new ValidationException(['group_id' => 'El grupo indicado no es válido.']);
            }
            $group = $this->groups->findById($groupId);
            if ($group === null || $group->stageId !== $stage->id) {
                throw new ValidationException(['group_id' => 'El grupo no pertenece a esta fase.']);
            }
            $data['group_id'] = $groupId;
        }

        // scheduled_date (nullable DATE "Y-m-d").
        if (array_key_exists('scheduled_date', $body)) {
            $data['scheduled_date'] = $this->normalizeDate($body['scheduled_date']);
        }

        // status (rounds enum) when provided.
        if (array_key_exists('status', $body) && $body['status'] !== null && $body['status'] !== '') {
            $status = (string) $body['status'];
            if (!in_array($status, self::STATUSES, true)) {
                throw new ValidationException([
                    'status' => 'Estado de fecha inválido (pending, in_progress, finished).',
                ]);
            }
            $data['status'] = $status;
        }

        $round = $this->rounds->create($data);

        return $this->responder->created($this->response, $round);
    }

    /**
     * Next calendar number for the stage = highest existing number + 1.
     */
    private function nextNumber(int $stageId): int
    {
        $max = 0;
        foreach ($this->rounds->findByStage($stageId) as $round) {
            if ($round->number > $max) {
                $max = $round->number;
            }
        }

        return $max + 1;
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
