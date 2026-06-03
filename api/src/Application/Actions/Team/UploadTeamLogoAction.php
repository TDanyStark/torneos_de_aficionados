<?php

declare(strict_types=1);

namespace App\Application\Actions\Team;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Application\Service\ImageUploadService;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Team\TeamRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\UploadedFileInterface;

/**
 * POST /api/v1/tournament-teams/{id}/logo  (organizer OR delegate owner, multipart)
 *
 * Compresses + center-crops the uploaded image to 398x398, stores it under
 * api/public/uploads/teams/, persists it on the team's logo_url and returns it.
 *
 * Response 200: { "logo_url": "/uploads/teams/<hex>.jpg", "team": {...} }
 */
final class UploadTeamLogoAction extends ApiAction
{
    private const FIELD = 'file';
    private const LOGO_SIZE = 398;
    private const PUBLIC_PREFIX = '/uploads/teams';

    public function __construct(
        JsonResponder $responder,
        private TeamRepository $teams,
        private TournamentRepository $tournaments,
        private TournamentAuthorizer $authorizer,
        private ImageUploadService $images
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

        // Organizer of the tournament OR the delegate who owns this team.
        $isOrganizer = $this->userHasRole($user, $team->tournamentId, 'organizer');
        $isOwnerDelegate = $team->delegateUserId !== null && $team->delegateUserId === $user->id;
        if (!$user->isAdmin && !$isOrganizer && !$isOwnerDelegate) {
            throw new ForbiddenException('No tienes permiso para editar este equipo.');
        }

        // Delegates cannot change the logo once registrations close.
        if (!$user->isAdmin && !$isOrganizer) {
            $tournament = $this->tournaments->findById($team->tournamentId);
            if ($tournament !== null && !$tournament->registrationOpen) {
                throw new ForbiddenException('Las inscripciones están cerradas. Solo el organizador puede editar el equipo.');
            }
        }

        $files = $this->request->getUploadedFiles();
        $file = $files[self::FIELD] ?? null;
        if (!$file instanceof UploadedFileInterface) {
            throw new ValidationException(
                [self::FIELD => 'No se recibió ningún archivo en el campo "file".']
            );
        }

        $logoUrl = $this->images->storeSquare(
            $file,
            $this->uploadsDir(),
            self::PUBLIC_PREFIX,
            self::LOGO_SIZE,
            self::FIELD
        );

        $updated = $this->teams->update($id, ['logo_url' => $logoUrl]);

        return $this->responder->success($this->response, [
            'logo_url' => $logoUrl,
            'team'     => $updated,
        ]);
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

    private function uploadsDir(): string
    {
        // src/Application/Actions/Team -> project root is five levels up.
        return dirname(__DIR__, 4) . '/public/uploads/teams';
    }
}
