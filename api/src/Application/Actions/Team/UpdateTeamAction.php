<?php

declare(strict_types=1);

namespace App\Application\Actions\Team;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Team\TeamRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/tournament-teams/{id}  (organizer OR delegate owner)
 * {id} is the team id -> authorized inline. Organizers may edit any team in
 * their tournament; the delegate may only edit the team they own.
 */
final class UpdateTeamAction extends ApiAction
{
    private const STATUSES = ['pending', 'approved', 'rejected', 'withdrawn'];

    public function __construct(
        JsonResponder $responder,
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

        $team = $this->teams->findById($id);
        if ($team === null) {
            throw new NotFoundException('Equipo no encontrado.');
        }

        // Organizer (any role check) OR the delegate who owns this team.
        $isOrganizer = $this->userHasRole($user, $team->tournamentId, 'organizer');
        $isOwnerDelegate = $team->delegateUserId !== null && $team->delegateUserId === $user->id;

        if (!$user->isAdmin && !$isOrganizer && !$isOwnerDelegate) {
            throw new ForbiddenException('No tienes permiso para editar este equipo.');
        }

        $body = $this->body();
        $data = [];
        $errors = [];

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if ($name === '') {
                $errors['name'] = 'El nombre del equipo es obligatorio.';
            } else {
                $data['name'] = $name;
            }
        }
        if (array_key_exists('short_name', $body)) {
            $shortName = trim((string) $body['short_name']);
            $data['short_name'] = $shortName !== '' ? $shortName : null;
        }
        if (array_key_exists('coach_name', $body)) {
            $coachName = trim((string) $body['coach_name']);
            if ($coachName !== '' && mb_strlen($coachName) > 120) {
                $errors['coach_name'] = 'El nombre del entrenador no puede superar 120 caracteres.';
            } else {
                $data['coach_name'] = $coachName !== '' ? $coachName : null;
            }
        }
        if (array_key_exists('logo_url', $body)) {
            $logoUrl = trim((string) $body['logo_url']);
            $data['logo_url'] = $logoUrl !== '' ? $logoUrl : null;
        }
        // Only organizers may change the lifecycle status here.
        if (array_key_exists('status', $body)) {
            if (!$isOrganizer && !$user->isAdmin) {
                throw new ForbiddenException('Solo el organizador puede cambiar el estado del equipo.');
            }
            $status = (string) $body['status'];
            if (!in_array($status, self::STATUSES, true)) {
                $errors['status'] = 'El estado del equipo no es válido.';
            } else {
                $data['status'] = $status;
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $updated = $this->teams->update($id, $data);

        return $this->responder->success($this->response, $updated);
    }

    private function userHasRole(User $user, int $tournamentId, string $role): bool
    {
        try {
            $this->authorizer->assert($user, $tournamentId, [$role]);

            return true;
        } catch (ForbiddenException) {
            return false;
        }
    }
}
