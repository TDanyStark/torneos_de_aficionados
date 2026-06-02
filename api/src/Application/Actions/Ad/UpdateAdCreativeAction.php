<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/ad-creatives/{id}  (admin)
 *
 * Partial update of a creative. is_default is NOT updatable here — the default
 * banner row is protected (a slot must always keep its default). Validates the
 * resulting window so ends_at >= starts_at.
 *
 * Body (all optional): media_type, media_url, cta_url, cta_label, is_active,
 * starts_at, ends_at.
 */
final class UpdateAdCreativeAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private AdCreativeRepository $creatives
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $id = (int) $this->arg('id', '0');

        $creative = $this->creatives->findById($id);
        if ($creative === null) {
            throw new NotFoundException('Creative no encontrado.');
        }

        $body = $this->body();
        $data = [];
        $errors = [];

        if (array_key_exists('media_type', $body)) {
            $mediaType = trim((string) $body['media_type']);
            if (!in_array($mediaType, CreateAdCreativeAction::MEDIA_TYPES, true)) {
                $errors['media_type'] = 'El tipo de media debe ser image o video.';
            } else {
                $data['media_type'] = $mediaType;
            }
        }

        if (array_key_exists('media_url', $body)) {
            $mediaUrl = trim((string) $body['media_url']);
            if ($mediaUrl === '') {
                $errors['media_url'] = 'La URL del media no puede estar vacía.';
            } else {
                $data['media_url'] = $mediaUrl;
            }
        }

        if (array_key_exists('cta_url', $body)) {
            $data['cta_url'] = $this->optionalString($body['cta_url']);
        }
        if (array_key_exists('cta_label', $body)) {
            $data['cta_label'] = $this->optionalString($body['cta_label']);
        }
        if (array_key_exists('is_active', $body)) {
            $data['is_active'] = !empty($body['is_active']);
        }

        $hasStarts = array_key_exists('starts_at', $body);
        $hasEnds   = array_key_exists('ends_at', $body);
        if ($hasStarts) {
            $data['starts_at'] = $this->normalizeDate($body['starts_at'], 'starts_at', $errors);
        }
        if ($hasEnds) {
            $data['ends_at'] = $this->normalizeDate($body['ends_at'], 'ends_at', $errors);
        }

        if ($errors === []) {
            // Resolve effective window (incoming values override stored ones).
            $effectiveStart = $hasStarts ? ($data['starts_at'] ?? null) : $creative->startsAt;
            $effectiveEnd   = $hasEnds ? ($data['ends_at'] ?? null) : $creative->endsAt;
            if ($effectiveStart !== null && $effectiveEnd !== null && $effectiveEnd < $effectiveStart) {
                $errors['ends_at'] = 'La fecha de fin debe ser posterior o igual a la de inicio.';
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $updated = $this->creatives->update($id, $data);

        return $this->responder->success($this->response, $updated);
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $trimmed = trim((string) $value);

        return $trimmed !== '' ? $trimmed : null;
    }

    /**
     * @param array<string,string> $errors
     */
    private function normalizeDate(mixed $value, string $field, array &$errors): ?string
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        $ts = strtotime((string) $value);
        if ($ts === false) {
            $errors[$field] = 'La fecha no tiene un formato válido.';

            return null;
        }

        return date('Y-m-d H:i:s', $ts);
    }
}
