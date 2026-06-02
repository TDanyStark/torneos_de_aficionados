<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Application\Settings\SettingsInterface;
use App\Domain\Shared\Exception\ValidationException;
use Psr\Http\Message\UploadedFileInterface;

/**
 * Reusable image upload pipeline: validates an uploaded image (real mime via
 * finfo, allowed types, size cap), then resizes + center-crops it to an EXACT
 * square (cover, no distortion), compresses it and writes a JPEG into the target
 * directory. Returns the public URL using the same APP_URL ('appUrl') mechanism
 * the ads upload uses.
 *
 * Rendering backend:
 *   - prefers Imagick when extension_loaded('imagick') is true,
 *   - otherwise falls back to GD (extension_loaded('gd')),
 *   - throws a clear ValidationException when neither is available.
 *
 * Output is always JPEG at the configured quality, so callers get a predictable
 * extension regardless of the source format.
 */
final class ImageUploadService
{
    private const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
    private const OUTPUT_QUALITY = 82;
    private const OUTPUT_EXT = 'jpg';

    /** @var array<string,string> real mime => canonical source kind */
    private const ALLOWED = [
        'image/jpeg' => 'jpeg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(private SettingsInterface $settings)
    {
    }

    /**
     * Validates, processes and stores the uploaded image as an exact size square.
     *
     * @param string $targetDir    absolute filesystem directory to write into
     * @param string $publicPrefix public URL prefix, e.g. "/uploads/tournaments"
     * @param int    $size         target square edge in pixels (width == height)
     * @param string $field        multipart field name used for error messages
     *
     * @return string the public URL of the stored image (absolute when APP_URL set)
     */
    public function storeSquare(
        UploadedFileInterface $file,
        string $targetDir,
        string $publicPrefix,
        int $size,
        string $field = 'file'
    ): string {
        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException(
                [$field => 'La subida del archivo falló (código ' . $file->getError() . ').']
            );
        }

        $mime = $this->detectMime($file);
        if (!isset(self::ALLOWED[$mime])) {
            throw new ValidationException(
                [$field => 'Tipo de archivo no permitido. Usa JPG, PNG o WEBP.']
            );
        }

        $declaredSize = $file->getSize();
        if ($declaredSize !== null && $declaredSize > self::MAX_IMAGE_BYTES) {
            $limitMb = (int) (self::MAX_IMAGE_BYTES / (1024 * 1024));
            throw new ValidationException(
                [$field => "El archivo supera el tamaño máximo permitido ({$limitMb} MB)."]
            );
        }

        // Read the full binary content from the uploaded stream.
        $stream = $file->getStream();
        $stream->rewind();
        $binary = (string) $stream->getContents();
        $stream->rewind();

        if ($binary === '') {
            throw new ValidationException([$field => 'El archivo está vacío.']);
        }

        if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            throw new ValidationException(
                [$field => 'No se pudo preparar el directorio de subidas.']
            );
        }

        $filename = bin2hex(random_bytes(16)) . '.' . self::OUTPUT_EXT;
        $targetPath = rtrim($targetDir, '/\\') . DIRECTORY_SEPARATOR . $filename;

        $this->renderSquare($binary, $targetPath, $size, $field);

        $relative = '/' . trim($publicPrefix, '/') . '/' . $filename;
        $appUrl = trim((string) $this->settings->get('appUrl'));

        return $appUrl !== '' ? $appUrl . $relative : $relative;
    }

    /**
     * Center-crops to a square and resizes to $size x $size, writing JPEG.
     * Dispatches to Imagick when available, GD otherwise.
     */
    private function renderSquare(string $binary, string $targetPath, int $size, string $field): void
    {
        if (extension_loaded('imagick')) {
            $this->renderWithImagick($binary, $targetPath, $size, $field);
            return;
        }

        if (extension_loaded('gd')) {
            $this->renderWithGd($binary, $targetPath, $size, $field);
            return;
        }

        throw new ValidationException(
            [$field => 'El servidor no tiene una extensión de imágenes disponible (Imagick o GD).']
        );
    }

    private function renderWithImagick(string $binary, string $targetPath, int $size, string $field): void
    {
        try {
            $image = new \Imagick();
            $image->readImageBlob($binary);
            $image->setImageColorspace(\Imagick::COLORSPACE_SRGB);

            // cropThumbnailImage scales to cover then center-crops to exact size.
            $image->cropThumbnailImage($size, $size);

            $image->setImageFormat('jpeg');
            $image->setImageCompression(\Imagick::COMPRESSION_JPEG);
            $image->setImageCompressionQuality(self::OUTPUT_QUALITY);
            $image->stripImage();

            if ($image->writeImage($targetPath) !== true) {
                throw new \RuntimeException('writeImage returned false');
            }

            $image->clear();
            $image->destroy();
        } catch (\Throwable $e) {
            throw new ValidationException(
                [$field => 'No se pudo procesar la imagen.']
            );
        }
    }

    private function renderWithGd(string $binary, string $targetPath, int $size, string $field): void
    {
        $src = @imagecreatefromstring($binary);
        if ($src === false) {
            throw new ValidationException([$field => 'No se pudo leer la imagen.']);
        }

        $srcW = imagesx($src);
        $srcH = imagesy($src);
        if ($srcW < 1 || $srcH < 1) {
            imagedestroy($src);
            throw new ValidationException([$field => 'La imagen tiene dimensiones inválidas.']);
        }

        // Cover: pick the largest centered square crop of the source.
        $crop = min($srcW, $srcH);
        $srcX = (int) (($srcW - $crop) / 2);
        $srcY = (int) (($srcH - $crop) / 2);

        $dst = imagecreatetruecolor($size, $size);
        if ($dst === false) {
            imagedestroy($src);
            throw new ValidationException([$field => 'No se pudo procesar la imagen.']);
        }

        // Flatten transparency onto a white background (output is JPEG).
        $white = imagecolorallocate($dst, 255, 255, 255);
        if ($white !== false) {
            imagefilledrectangle($dst, 0, 0, $size, $size, $white);
        }

        $ok = imagecopyresampled(
            $dst,
            $src,
            0,
            0,
            $srcX,
            $srcY,
            $size,
            $size,
            $crop,
            $crop
        );

        if ($ok === false) {
            imagedestroy($src);
            imagedestroy($dst);
            throw new ValidationException([$field => 'No se pudo redimensionar la imagen.']);
        }

        $written = imagejpeg($dst, $targetPath, self::OUTPUT_QUALITY);

        imagedestroy($src);
        imagedestroy($dst);

        if ($written === false) {
            throw new ValidationException([$field => 'No se pudo guardar la imagen.']);
        }
    }

    private function detectMime(UploadedFileInterface $file): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);

        $stream = $file->getStream();
        $stream->rewind();
        $contents = $stream->read(1024 * 1024);
        $stream->rewind();

        $mime = $finfo->buffer($contents);

        return is_string($mime) ? $mime : 'application/octet-stream';
    }
}
