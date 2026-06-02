<?php

declare(strict_types=1);

namespace App\Application\Actions\Stage;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/stages/{id}  (organizer)
 * Updates a stage. Authorization is enforced here (route arg is the stage id).
 */
final class UpdateStageAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private StageRepository $stages,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $stage = $this->stages->findById($id);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $body = $this->body();
        $data = [];
        $errors = [];

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if ($name === '') {
                $errors['name'] = 'El nombre de la fase es obligatorio.';
            } else {
                $data['name'] = $name;
            }
        }
        if (array_key_exists('type', $body)) {
            $type = (string) $body['type'];
            if (!in_array($type, StageValidator::TYPES, true)) {
                $errors['type'] = 'El tipo de fase debe ser league, groups o knockout.';
            } else {
                $data['type'] = $type;
            }
        }
        if (array_key_exists('position', $body)) {
            $data['position'] = max(1, (int) $body['position']);
        }
        if (array_key_exists('legs', $body)) {
            $legs = (int) $body['legs'];
            if (!StageValidator::isValidLegs($legs)) {
                $errors['legs'] = 'El número de partidos (legs) debe ser 1 o 2.';
            } else {
                $data['legs'] = $legs;
            }
        }
        if (array_key_exists('status', $body)) {
            $status = (string) $body['status'];
            if (!in_array($status, ['pending', 'in_progress', 'finished'], true)) {
                $errors['status'] = 'El estado de la fase no es válido.';
            } else {
                $data['status'] = $status;
            }
        }
        if (array_key_exists('bracket_size', $body)) {
            // Effective type = incoming type (if valid) else the stored type.
            $effectiveType = isset($data['type']) ? (string) $data['type'] : $stage->type;
            $raw = $body['bracket_size'];
            if ($effectiveType !== 'knockout' || $raw === '' || $raw === null) {
                // Non-knockout stages never carry a bracket size.
                $data['bracket_size'] = null;
            } else {
                $bracketSize = (int) $raw;
                if (!StageValidator::isValidBracketSize($bracketSize)) {
                    $errors['bracket_size'] = 'El tamaño del cuadro debe ser 4, 8, 16, 32, 64 o 128.';
                } else {
                    $data['bracket_size'] = $bracketSize;
                }
            }
        }
        if (array_key_exists('tiebreakers', $body)) {
            $data['tiebreakers'] = StageValidator::normalizeTiebreakers($body['tiebreakers']);
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $updated = $this->stages->update($id, $data);

        return $this->responder->success($this->response, $updated);
    }
}
