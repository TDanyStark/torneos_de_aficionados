<?php

declare(strict_types=1);

namespace App\Domain\Ad;

use JsonSerializable;

/**
 * Ad creative (publicidad). The content served in a slot: image or video with an
 * optional CTA. is_default marks the "espacio disponible -> WhatsApp" banner
 * auto-created with each slot. is_active + starts_at/ends_at define vigencia for
 * sellable creatives. Booleans serialize as 0|1 (frontend BackendBool).
 */
final class AdCreative implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $adSlotId,
        public readonly string $mediaType,
        public readonly string $mediaUrl,
        public readonly ?string $ctaUrl,
        public readonly ?string $ctaLabel,
        public readonly bool $isDefault,
        public readonly bool $isActive,
        public readonly ?string $startsAt,
        public readonly ?string $endsAt,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        $str = static fn (string $k): ?string =>
            isset($row[$k]) && $row[$k] !== null ? (string) $row[$k] : null;

        return new self(
            (int) $row['id'],
            (int) $row['ad_slot_id'],
            (string) $row['media_type'],
            (string) $row['media_url'],
            $str('cta_url'),
            $str('cta_label'),
            (bool) $row['is_default'],
            (bool) $row['is_active'],
            $str('starts_at'),
            $str('ends_at'),
            $str('created_at'),
            $str('updated_at'),
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'         => $this->id,
            'ad_slot_id' => $this->adSlotId,
            'media_type' => $this->mediaType,
            'media_url'  => $this->mediaUrl,
            'cta_url'    => $this->ctaUrl,
            'cta_label'  => $this->ctaLabel,
            'is_default' => $this->isDefault ? 1 : 0,
            'is_active'  => $this->isActive ? 1 : 0,
            'starts_at'  => $this->startsAt,
            'ends_at'    => $this->endsAt,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
