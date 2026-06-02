<?php

declare(strict_types=1);

namespace App\Domain\Team;

use JsonSerializable;

/**
 * Tournament team. Teams are scoped per tournament (not shared across
 * tournaments in the MVP). Lifecycle: pending -> approved/rejected/withdrawn.
 */
final class Team implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $tournamentId,
        public readonly string $name,
        public readonly ?string $shortName,
        public readonly ?string $coachName,
        public readonly ?string $logoUrl,
        public readonly ?int $delegateUserId,
        public readonly string $status,
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
            (int) $row['tournament_id'],
            (string) $row['name'],
            $row['short_name'] !== null ? (string) $row['short_name'] : null,
            isset($row['coach_name']) && $row['coach_name'] !== null ? (string) $row['coach_name'] : null,
            $row['logo_url'] !== null ? (string) $row['logo_url'] : null,
            $row['delegate_user_id'] !== null ? (int) $row['delegate_user_id'] : null,
            (string) $row['status'],
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
            'id'               => $this->id,
            'tournament_id'    => $this->tournamentId,
            'name'             => $this->name,
            'short_name'       => $this->shortName,
            'coach_name'       => $this->coachName,
            'logo_url'         => $this->logoUrl,
            'delegate_user_id' => $this->delegateUserId,
            'status'           => $this->status,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
