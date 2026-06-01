<?php

declare(strict_types=1);

namespace App\Application\Actions\Stage;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/tournaments/{id}/stages  (organizer)
 * Creates a stage (league | groups | knockout) for a tournament.
 */
final class CreateStageAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private StageRepository $stages,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $tournamentId = (int) $this->arg('id', '0');

        if ($this->tournaments->findById($tournamentId) === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $body = $this->body();

        $name     = trim((string) ($body['name'] ?? ''));
        $type     = (string) ($body['type'] ?? '');
        $position = isset($body['position']) ? (int) $body['position'] : 1;
        $legs     = isset($body['legs']) ? (int) $body['legs'] : 1;

        $errors = [];
        if ($name === '') {
            $errors['name'] = 'El nombre de la fase es obligatorio.';
        }
        if (!in_array($type, StageValidator::TYPES, true)) {
            $errors['type'] = 'El tipo de fase debe ser league, groups o knockout.';
        }
        if (!StageValidator::isValidLegs($legs)) {
            $errors['legs'] = 'El número de partidos (legs) debe ser 1 o 2.';
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $stage = $this->stages->create($tournamentId, [
            'name'        => $name,
            'type'        => $type,
            'position'    => max(1, $position),
            'legs'        => $legs,
            'tiebreakers' => StageValidator::normalizeTiebreakers($body['tiebreakers'] ?? null),
            'status'      => 'pending',
        ]);

        return $this->responder->created($this->response, $stage);
    }
}
