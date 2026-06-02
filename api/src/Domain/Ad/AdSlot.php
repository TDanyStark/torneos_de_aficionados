<?php

declare(strict_types=1);

namespace App\Domain\Ad;

use JsonSerializable;

/**
 * Ad slot (publicidad). A fixed ad position in the UI. Global when
 * tournamentId is null, otherwise scoped to a tournament. Booleans serialize as
 * 0|1 to match the frontend BackendBool convention.
 */
final class AdSlot implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly ?int $tournamentId,
        public readonly string $placement,
        public readonly string $name,
        public readonly bool $isActive,
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
            isset($row['tournament_id']) && $row['tournament_id'] !== null
                ? (int) $row['tournament_id']
                : null,
            (string) $row['placement'],
            (string) $row['name'],
            (bool) $row['is_active'],
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
            'id'            => $this->id,
            'tournament_id' => $this->tournamentId,
            'placement'     => $this->placement,
            'name'          => $this->name,
            'is_active'     => $this->isActive ? 1 : 0,
            'created_at'    => $this->createdAt,
            'updated_at'    => $this->updatedAt,
        ];
    }
}
