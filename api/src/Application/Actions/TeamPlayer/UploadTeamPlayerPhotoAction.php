<?php

declare(strict_types=1);

namespace App\Application\Actions\TeamPlayer;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Application\Service\ImageUploadService;
use App\Domain\Player\PlayerRepository;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Team\TeamRepository;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\UploadedFileInterface;

/**
 * POST /api/v1/team-players/{id}/photo  (organizer OR delegate owner, multipart)
 *
 * Compresses + center-crops the uploaded image to 398x398, stores it under
 * api/public/uploads/players/, persists it on the underlying player's photo_url
 * and returns it. {id} is the roster entry id -> resolves player + team.
 *
 * Response 200: { "photo_url": "/uploads/players/<hex>.jpg", "team_player": {...} }
 */
final class UploadTeamPlayerPhotoAction extends ApiAction
{
    private const FIELD = 'file';
    private const PHOTO_SIZE = 398;
    private const PUBLIC_PREFIX = '/uploads/players';

    public function __construct(
        JsonResponder $responder,
        private TeamPlayerRepository $teamPlayers,
        private TeamRepository $teams,
        private PlayerRepository $players,
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

        $teamPlayer = $this->teamPlayers->findById($id);
        if ($teamPlayer === null) {
            throw new NotFoundException('Jugador de la plantilla no encontrado.');
        }

        $team = $this->teams->findById($teamPlayer->tournamentTeamId);
        if ($team === null) {
            throw new NotFoundException('Equipo no encontrado.');
        }

        // Organizer of the tournament OR the delegate who owns this team.
        $isOrganizer = $this->userHasRole($user, $team->tournamentId, 'organizer');
        $isOwnerDelegate = $team->delegateUserId !== null && $team->delegateUserId === $user->id;
        if (!$user->isAdmin && !$isOrganizer && !$isOwnerDelegate) {
            throw new ForbiddenException('No tienes permiso para editar este equipo.');
        }

        // Delegates cannot change photos once registrations close.
        if (!$user->isAdmin && !$isOrganizer) {
            $tournament = $this->tournaments->findById($team->tournamentId);
            if ($tournament !== null && !$tournament->registrationOpen) {
                throw new ForbiddenException('Las inscripciones están cerradas. Solo el organizador puede modificar la plantilla.');
            }
        }

        $files = $this->request->getUploadedFiles();
        $file = $files[self::FIELD] ?? null;
        if (!$file instanceof UploadedFileInterface) {
            throw new ValidationException(
                [self::FIELD => 'No se recibió ningún archivo en el campo "file".']
            );
        }

        $photoUrl = $this->images->storeSquare(
            $file,
            $this->uploadsDir(),
            self::PUBLIC_PREFIX,
            self::PHOTO_SIZE,
            self::FIELD
        );

        $this->players->update($teamPlayer->playerId, ['photo_url' => $photoUrl]);

        // Re-read the roster entry so the joined photo_url reflects the update.
        $updated = $this->teamPlayers->findById($id);

        return $this->responder->success($this->response, [
            'photo_url'   => $photoUrl,
            'team_player' => $updated,
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
        // src/Application/Actions/TeamPlayer -> project root is five levels up.
        return dirname(__DIR__, 4) . '/public/uploads/players';
    }
}
