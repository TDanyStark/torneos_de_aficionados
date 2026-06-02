<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Application\Settings\SettingsInterface;
use App\Domain\Shared\Exception\ValidationException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\UploadedFileInterface;

/**
 * POST /api/v1/ad-creatives/upload  (admin, multipart/form-data)
 *
 * Stores an uploaded image/video under the public uploads folder and returns the
 * media_url to attach to a creative (POST /ad-creatives). The create-creative
 * endpoint itself stays JSON; this is the only multipart endpoint.
 *
 * Request: multipart field name "file".
 * Response 201: { "media_url": "/uploads/ads/<hex>.<ext>", "media_type": "image"|"video" }
 *
 * Validation:
 *   - field present + UPLOAD_ERR_OK
 *   - REAL mime via finfo (not the client-declared type)
 *   - allowed mimes: image/jpeg, image/png, image/webp, image/gif,
 *                    video/mp4, video/webm
 *   - max size: 5 MB images, 20 MB video
 * Storage: api/public/uploads/ads/<bin2hex(random_bytes(16))>.<ext>
 * media_url: relative "/uploads/ads/<file>" by default; absolute when APP_URL is
 *            configured (settings 'appUrl').
 */
final class UploadCreativeMediaAction extends ApiAction
{
    private const FIELD = 'file';

    private const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
    private const MAX_VIDEO_BYTES = 20 * 1024 * 1024;  // 20 MB

    /** @var array<string,array{type:string,ext:string,max:int}> */
    private const ALLOWED = [
        'image/jpeg' => ['type' => 'image', 'ext' => 'jpg',  'max' => self::MAX_IMAGE_BYTES],
        'image/png'  => ['type' => 'image', 'ext' => 'png',  'max' => self::MAX_IMAGE_BYTES],
        'image/webp' => ['type' => 'image', 'ext' => 'webp', 'max' => self::MAX_IMAGE_BYTES],
        'image/gif'  => ['type' => 'image', 'ext' => 'gif',  'max' => self::MAX_IMAGE_BYTES],
        'video/mp4'  => ['type' => 'video', 'ext' => 'mp4',  'max' => self::MAX_VIDEO_BYTES],
        'video/webm' => ['type' => 'video', 'ext' => 'webm', 'max' => self::MAX_VIDEO_BYTES],
    ];

    public function __construct(
        JsonResponder $responder,
        private SettingsInterface $settings
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $files = $this->request->getUploadedFiles();
        $file = $files[self::FIELD] ?? null;

        if (!$file instanceof UploadedFileInterface) {
            throw new ValidationException(
                [self::FIELD => 'No se recibió ningún archivo en el campo "file".']
            );
        }

        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException(
                [self::FIELD => 'La subida del archivo falló (código ' . $file->getError() . ').']
            );
        }

        // Detect the REAL mime from the file contents (client type is ignored).
        $mime = $this->detectMime($file);

        if (!isset(self::ALLOWED[$mime])) {
            throw new ValidationException(
                [self::FIELD => 'Tipo de archivo no permitido. Usa JPG, PNG, WEBP, GIF, MP4 o WEBM.']
            );
        }

        $spec = self::ALLOWED[$mime];

        $size = $file->getSize();
        if ($size !== null && $size > $spec['max']) {
            $limitMb = (int) ($spec['max'] / (1024 * 1024));
            throw new ValidationException(
                [self::FIELD => "El archivo supera el tamaño máximo permitido ({$limitMb} MB)."]
            );
        }

        $dir = $this->uploadsDir();
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new ValidationException(
                [self::FIELD => 'No se pudo preparar el directorio de subidas.']
            );
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $spec['ext'];
        $file->moveTo($dir . DIRECTORY_SEPARATOR . $filename);

        $relative = '/uploads/ads/' . $filename;
        $appUrl = trim((string) $this->settings->get('appUrl'));
        $mediaUrl = $appUrl !== '' ? $appUrl . $relative : $relative;

        return $this->responder->created($this->response, [
            'media_url'  => $mediaUrl,
            'media_type' => $spec['type'],
        ]);
    }

    private function uploadsDir(): string
    {
        // src/Application/Actions/Ad -> project root is five levels up.
        return dirname(__DIR__, 4) . '/public/uploads/ads';
    }

    private function detectMime(UploadedFileInterface $file): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);

        // Read a chunk from the uploaded stream without moving it yet.
        $stream = $file->getStream();
        $stream->rewind();
        $contents = $stream->read(1024 * 1024);
        $stream->rewind();

        $mime = $finfo->buffer($contents);

        return is_string($mime) ? $mime : 'application/octet-stream';
    }
}
