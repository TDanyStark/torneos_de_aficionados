<?php

declare(strict_types=1);

namespace App\Application\Actions\Referee;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Referee\RefereeRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/tournaments/{id}/referees  (organizer)
 *
 * Adds a referee (name only) to a tournament's directory. {id} is the
 * tournament id -> guarded by RoleMiddleware at the route.
 *
 * Body: { "name": string (required, non-empty, max 120) }
 */
final class CreateRefereeAction extends ApiAction
{
    private const MAX_NAME = 120;

    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private RefereeRepository $referees
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

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            throw new ValidationException(['name' => 'El nombre del árbitro es obligatorio.']);
        }
        if (mb_strlen($name) > self::MAX_NAME) {
            throw new ValidationException([
                'name' => 'El nombre del árbitro no puede superar los ' . self::MAX_NAME . ' caracteres.',
            ]);
        }

        $referee = $this->referees->create($tournamentId, ['name' => $name]);

        return $this->responder->created($this->response, $referee);
    }
}
