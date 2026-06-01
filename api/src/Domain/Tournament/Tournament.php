<?php

declare(strict_types=1);

namespace App\Domain\Tournament;

use JsonSerializable;

/**
 * Tournament entity. The sport-agnostic core aggregate. Points/periods are
 * copied from the sport's default_config at creation and remain editable.
 */
final class Tournament implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $sportId,
        public readonly int $ownerUserId,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly ?string $logoUrl,
        public readonly string $status,
        public readonly int $periodsCount,
        public readonly int $pointsWin,
        public readonly int $pointsDraw,
        public readonly int $pointsLoss,
        public readonly bool $allowLateRegistration,
        public readonly bool $registrationOpen,
        public readonly ?string $registrationCode,
        public readonly ?string $startsAt,
        public readonly string $timezone,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        return new self(
            (int) $row['id'],
            (int) $row['sport_id'],
            (int) $row['owner_user_id'],
            (string) $row['name'],
            (string) $row['slug'],
            $row['description'] !== null ? (string) $row['description'] : null,
            $row['logo_url'] !== null ? (string) $row['logo_url'] : null,
            (string) $row['status'],
            (int) $row['periods_count'],
            (int) $row['points_win'],
            (int) $row['points_draw'],
            (int) $row['points_loss'],
            (bool) $row['allow_late_registration'],
            (bool) $row['registration_open'],
            $row['registration_code'] !== null ? (string) $row['registration_code'] : null,
            $row['starts_at'] !== null ? (string) $row['starts_at'] : null,
            (string) $row['timezone'],
            isset($row['created_at']) ? (string) $row['created_at'] : null,
            isset($row['updated_at']) ? (string) $row['updated_at'] : null,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                      => $this->id,
            'sport_id'                => $this->sportId,
            'owner_user_id'           => $this->ownerUserId,
            'name'                    => $this->name,
            'slug'                    => $this->slug,
            'description'             => $this->description,
            'logo_url'                => $this->logoUrl,
            'status'                  => $this->status,
            'periods_count'           => $this->periodsCount,
            'points_win'              => $this->pointsWin,
            'points_draw'             => $this->pointsDraw,
            'points_loss'             => $this->pointsLoss,
            'allow_late_registration' => $this->allowLateRegistration,
            'registration_open'       => $this->registrationOpen,
            'registration_code'       => $this->registrationCode,
            'starts_at'               => $this->startsAt,
            'timezone'                => $this->timezone,
            'created_at'              => $this->createdAt,
            'updated_at'              => $this->updatedAt,
        ];
    }
}
