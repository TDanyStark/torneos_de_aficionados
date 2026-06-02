<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use JsonSerializable;

/**
 * A round (jornada) of a stage/group. Calendar order is `number` ASC.
 */
final class Round implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $stageId,
        public readonly ?int $groupId,
        public readonly int $number,
        public readonly ?string $name,
        public readonly ?string $scheduledDate,
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
            (int) $row['stage_id'],
            isset($row['group_id']) && $row['group_id'] !== null ? (int) $row['group_id'] : null,
            (int) $row['number'],
            isset($row['name']) && $row['name'] !== null ? (string) $row['name'] : null,
            isset($row['scheduled_date']) && $row['scheduled_date'] !== null
                ? (string) $row['scheduled_date'] : null,
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
            'id'             => $this->id,
            'stage_id'       => $this->stageId,
            'group_id'       => $this->groupId,
            'number'         => $this->number,
            'name'           => $this->name,
            'scheduled_date' => $this->scheduledDate,
            'status'         => $this->status,
            'created_at'     => $this->createdAt,
            'updated_at'     => $this->updatedAt,
        ];
    }
}
