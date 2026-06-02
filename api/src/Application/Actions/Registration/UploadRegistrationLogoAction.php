<?php

declare(strict_types=1);

namespace App\Application\Actions\Registration;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Application\Service\ImageUploadService;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\UploadedFileInterface;

/**
 * POST /api/v1/tournaments/{id}/registration-logo  (auth, code-gated, multipart)
 *
 * Public self-registration helper: a delegate uploads a TEAM logo before
 * submitting the registration. Authorization is by the registration_code
 * (multipart field "registration_code"), NOT a pre-existing role, mirroring
 * CreateRegistrationAction. The image is compressed + center-cropped to EXACTLY
 * 398x398 and stored under api/public/uploads/teams/. Returns the URL only; it
 * is persisted later when the registration is submitted.
 *
 * Response 200: { "logo_url": "/uploads/teams/<hex>.jpg" }
 */
final class UploadRegistrationLogoAction extends ApiAction
{
    private const FIELD = 'file';
    private const LOGO_SIZE = 398;
    private const PUBLIC_PREFIX = '/uploads/teams';

    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private ImageUploadService $images
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $id = (int) $this->arg('id', '0');

        $tournament = $this->tournaments->findById($id);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $body = $this->body();
        $code = isset($body['registration_code']) ? trim((string) $body['registration_code']) : '';
        if ($code === '') {
            throw new ValidationException(['registration_code' => 'El código de inscripción es obligatorio.']);
        }
        if ($tournament->registrationCode === null || !hash_equals($tournament->registrationCode, $code)) {
            throw new ForbiddenException('El código de inscripción no es válido para este torneo.');
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

        return $this->responder->success($this->response, ['logo_url' => $logoUrl]);
    }

    private function uploadsDir(): string
    {
        // src/Application/Actions/Registration -> project root is five levels up.
        return dirname(__DIR__, 4) . '/public/uploads/teams';
    }
}
