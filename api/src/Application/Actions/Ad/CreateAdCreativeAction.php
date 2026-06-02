<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Ad\AdSlotRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/ad-creatives  (admin)
 *
 * Creates a SOLD creative (is_default is ALWAYS 0 here; the default banner is
 * auto-managed by CreateAdSlotService). media_url must be a URL already produced
 * by POST /ad-creatives/upload.
 *
 * Body:
 *   - ad_slot_id  int     (required, must exist)
 *   - media_type  string  ('image'|'video', required)
 *   - media_url   string  (required, non-empty)
 *   - cta_url     ?string
 *   - cta_label   ?string
 *   - is_active   ?bool    (default true)
 *   - starts_at   ?string  (Y-m-d H:i:s / ISO-ish)
 *   - ends_at     ?string  (>= starts_at when both present)
 */
final class CreateAdCreativeAction extends ApiAction
{
    public const MEDIA_TYPES = ['image', 'video'];

    public function __construct(
        JsonResponder $responder,
        private AdCreativeRepository $creatives,
        private AdSlotRepository $slots
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $body = $this->body();
        $errors = [];

        $slotId = isset($body['ad_slot_id']) && is_numeric($body['ad_slot_id'])
            ? (int) $body['ad_slot_id']
            : 0;
        if ($slotId <= 0) {
            $errors['ad_slot_id'] = 'El slot es obligatorio.';
        }

        $mediaType = isset($body['media_type']) ? trim((string) $body['media_type']) : '';
        if (!in_array($mediaType, self::MEDIA_TYPES, true)) {
            $errors['media_type'] = 'El tipo de media debe ser image o video.';
        }

        $mediaUrl = isset($body['media_url']) ? trim((string) $body['media_url']) : '';
        if ($mediaUrl === '') {
            $errors['media_url'] = 'La URL del media es obligatoria.';
        }

        $startsAt = $this->normalizeDate($body['starts_at'] ?? null, 'starts_at', $errors);
        $endsAt   = $this->normalizeDate($body['ends_at'] ?? null, 'ends_at', $errors);

        if ($startsAt !== null && $endsAt !== null && $endsAt < $startsAt) {
            $errors['ends_at'] = 'La fecha de fin debe ser posterior o igual a la de inicio.';
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        if ($this->slots->findById($slotId) === null) {
            throw new NotFoundException('Slot no encontrado.');
        }

        $creative = $this->creatives->create([
            'ad_slot_id' => $slotId,
            'media_type' => $mediaType,
            'media_url'  => $mediaUrl,
            'cta_url'    => $this->optionalString($body['cta_url'] ?? null),
            'cta_label'  => $this->optionalString($body['cta_label'] ?? null),
            'is_default' => false,
            'is_active'  => array_key_exists('is_active', $body) ? !empty($body['is_active']) : true,
            'starts_at'  => $startsAt,
            'ends_at'    => $endsAt,
        ]);

        return $this->responder->created($this->response, $creative);
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
     * Validates an optional datetime string. Empty/absent => null. Accepts any
     * strtotime-parsable value and normalizes to 'Y-m-d H:i:s' for storage and
     * comparability. Records an error (does not throw) for invalid input.
     *
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
