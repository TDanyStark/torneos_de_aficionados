<?php

declare(strict_types=1);

namespace App\Domain\Group;

use JsonSerializable;

/**
 * Group (grupo) inside a "groups"-type stage. Team membership (group_teams)
 * arrives in Phase 3.
 */
final class Group implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $stageId,
        public readonly string $name,
        public readonly int $position,
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
            (int) $row['stage_id'],
            (string) $row['name'],
            (int) $row['position'],
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
            'id'         => $this->id,
            'stage_id'   => $this->stageId,
            'name'       => $this->name,
            'position'   => $this->position,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
