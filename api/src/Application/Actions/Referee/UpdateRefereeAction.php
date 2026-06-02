<?php

declare(strict_types=1);

namespace App\Application\Actions\Referee;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Referee\RefereeRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/referees/{id}  (organizer)
 *
 * Renames a referee. {id} is the referee id -> the owning tournament is
 * resolved from the referee and authorized inline.
 *
 * Body: { "name": string (required, non-empty, max 120) }
 */
final class UpdateRefereeAction extends ApiAction
{
    private const MAX_NAME = 120;

    public function __construct(
        JsonResponder $responder,
        private RefereeRepository $referees,
        private TournamentRepository $tournaments,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $referee = $this->referees->findById($id);
        if ($referee === null) {
            throw new NotFoundException('Árbitro no encontrado.');
        }

        $tournament = $this->tournaments->findById($referee->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $this->authorizer->assert($user, $tournament->id, ['organizer']);

        $body = $this->body();

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            throw new ValidationException(['name' => 'El nombre del árbitro es obligatorio.']);
        }
        if (mb_strlen($name) > self::MAX_NAME) {
            throw new ValidationException([
                'name' => 'El nombre del árbitro no puede superar los ' . self::MAX_NAME . ' caracteres.',
            ]);
        }

        $updated = $this->referees->update($id, ['name' => $name]);

        return $this->responder->success($this->response, $updated);
    }
}
