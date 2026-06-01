<?php

declare(strict_types=1);

namespace App\Application\Actions\Role;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/tournaments/{id}/roles  (organizer)
 * Designates a referee or delegate by their email. The user must already have
 * an account. organizer/player roles are not assignable here (organizer is set
 * at creation; player is handled by team registration in later phases).
 */
final class CreateTournamentRoleAction extends ApiAction
{
    private const ASSIGNABLE_ROLES = ['referee', 'delegate'];

    public function __construct(
        JsonResponder $responder,
        private TournamentUserRoleRepository $roles,
        private TournamentRepository $tournaments,
        private UserRepository $users
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
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $role  = (string) ($body['role'] ?? '');

        $errors = [];
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'El correo no es válido.';
        }
        if (!in_array($role, self::ASSIGNABLE_ROLES, true)) {
            $errors['role'] = 'El rol debe ser árbitro (referee) o delegado (delegate).';
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $row = $this->users->findRowByEmail($email);
        if ($row === null) {
            throw new NotFoundException('No existe un usuario registrado con ese correo.');
        }
        $userId = (int) $row['id'];

        if ($this->roles->exists($tournamentId, $userId, $role, null)) {
            throw new ValidationException([
                'role' => 'El usuario ya tiene ese rol en este torneo.',
            ]);
        }

        $created = $this->roles->create($tournamentId, $userId, $role, null);

        return $this->responder->created($this->response, $created);
    }
}
