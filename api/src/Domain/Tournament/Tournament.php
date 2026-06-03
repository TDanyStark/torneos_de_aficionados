<?php

declare(strict_types=1);

namespace App\Domain\Tournament;

use JsonSerializable;

/**
 * Tournament entity. The sport-agnostic core aggregate. Points/periods are
 * copied from the sport's default_config at creation and remain editable.
 *
 * Fase 9 added: ends_at, rules, prizes (JSON map first/second/third/others),
 * suspension_red_card, suspension_double_yellow, roster_limit (NULL = no limit)
 * and registration_info.
 */
final class Tournament implements JsonSerializable
{
    /**
     * @param array<string,mixed>|null $prizes
     */
    public function __construct(
        public readonly int $id,
        public readonly int $sportId,
        public readonly int $ownerUserId,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly ?string $logoUrl,
        public readonly string $status,
        public readonly bool $isPublic,
        public readonly int $periodsCount,
        public readonly int $pointsWin,
        public readonly int $pointsDraw,
        public readonly int $pointsLoss,
        public readonly bool $allowLateRegistration,
        public readonly bool $registrationOpen,
        public readonly ?string $registrationCode,
        public readonly ?string $startsAt,
        public readonly ?string $endsAt,
        public readonly string $timezone,
        public readonly ?string $rules,
        public readonly ?array $prizes,
        public readonly bool $suspensionRedCard,
        public readonly bool $suspensionDoubleYellow,
        public readonly ?int $rosterLimit,
        public readonly ?string $registrationInfo,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        $prizes = null;
        if (isset($row['prizes']) && $row['prizes'] !== null && $row['prizes'] !== '') {
            $decoded = json_decode((string) $row['prizes'], true);
            $prizes = is_array($decoded) ? $decoded : null;
        }

        return new self(
            (int) $row['id'],
            (int) $row['sport_id'],
            (int) $row['owner_user_id'],
            (string) $row['name'],
            (string) $row['slug'],
            $row['description'] !== null ? (string) $row['description'] : null,
            $row['logo_url'] !== null ? (string) $row['logo_url'] : null,
            (string) $row['status'],
            isset($row['is_public']) ? (bool) $row['is_public'] : false,
            (int) $row['periods_count'],
            (int) $row['points_win'],
            (int) $row['points_draw'],
            (int) $row['points_loss'],
            (bool) $row['allow_late_registration'],
            (bool) $row['registration_open'],
            $row['registration_code'] !== null ? (string) $row['registration_code'] : null,
            $row['starts_at'] !== null ? (string) $row['starts_at'] : null,
            isset($row['ends_at']) && $row['ends_at'] !== null ? (string) $row['ends_at'] : null,
            (string) $row['timezone'],
            isset($row['rules']) && $row['rules'] !== null ? (string) $row['rules'] : null,
            $prizes,
            isset($row['suspension_red_card']) ? (bool) $row['suspension_red_card'] : false,
            isset($row['suspension_double_yellow']) ? (bool) $row['suspension_double_yellow'] : false,
            isset($row['roster_limit']) && $row['roster_limit'] !== null ? (int) $row['roster_limit'] : null,
            isset($row['registration_info']) && $row['registration_info'] !== null
                ? (string) $row['registration_info']
                : null,
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
            'id'                       => $this->id,
            'sport_id'                 => $this->sportId,
            'owner_user_id'            => $this->ownerUserId,
            'name'                     => $this->name,
            'slug'                     => $this->slug,
            'description'              => $this->description,
            'logo_url'                 => $this->logoUrl,
            'status'                   => $this->status,
            'is_public'                => $this->isPublic,
            'periods_count'            => $this->periodsCount,
            'points_win'               => $this->pointsWin,
            'points_draw'              => $this->pointsDraw,
            'points_loss'              => $this->pointsLoss,
            'allow_late_registration'  => $this->allowLateRegistration,
            'registration_open'        => $this->registrationOpen,
            'registration_code'        => $this->registrationCode,
            'starts_at'                => $this->startsAt,
            'ends_at'                  => $this->endsAt,
            'timezone'                 => $this->timezone,
            'rules'                    => $this->rules,
            'prizes'                   => $this->prizes,
            'suspension_red_card'      => $this->suspensionRedCard,
            'suspension_double_yellow' => $this->suspensionDoubleYellow,
            'roster_limit'             => $this->rosterLimit,
            'registration_info'        => $this->registrationInfo,
            'created_at'               => $this->createdAt,
            'updated_at'               => $this->updatedAt,
        ];
    }
}
