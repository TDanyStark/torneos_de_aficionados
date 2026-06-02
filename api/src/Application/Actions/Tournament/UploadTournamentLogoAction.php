<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Application\Service\ImageUploadService;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\UploadedFileInterface;

/**
 * POST /api/v1/tournaments/{id}/logo  (auth, OWNER or admin, multipart/form-data)
 *
 * Accepts an image in the multipart field "file", compresses + center-crops it
 * to EXACTLY 398x398 via ImageUploadService, stores it under
 * api/public/uploads/tournaments/, persists the resulting URL on the
 * tournament's logo_url and returns it.
 *
 * Response 200: { "logo_url": "/uploads/tournaments/<hex>.jpg", "tournament": {...} }
 */
final class UploadTournamentLogoAction extends ApiAction
{
    private const FIELD = 'file';
    private const LOGO_SIZE = 398;
    private const PUBLIC_PREFIX = '/uploads/tournaments';

    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private ImageUploadService $images
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $tournament = $this->tournaments->findById($id);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        if (!$user->isAdmin && $tournament->ownerUserId !== $user->id) {
            throw new ForbiddenException('Solo el organizador propietario puede editar este torneo.');
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

        $updated = $this->tournaments->update($id, ['logo_url' => $logoUrl]);

        return $this->responder->success($this->response, [
            'logo_url'   => $logoUrl,
            'tournament' => $updated,
        ]);
    }

    private function uploadsDir(): string
    {
        // src/Application/Actions/Tournament -> project root is five levels up.
        return dirname(__DIR__, 4) . '/public/uploads/tournaments';
    }
}
