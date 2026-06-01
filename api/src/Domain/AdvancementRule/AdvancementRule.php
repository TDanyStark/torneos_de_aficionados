<?php

declare(strict_types=1);

namespace App\Domain\AdvancementRule;

use JsonSerializable;

/**
 * Advancement rule: how teams qualify out of a stage/group into a target stage
 * (or get eliminated). Drives bracket seeding in later phases.
 */
final class AdvancementRule implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $stageId,
        public readonly ?int $groupId,
        public readonly ?int $qualifiesCount,
        public readonly ?int $eliminatesCount,
        public readonly ?int $targetStageId,
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
            $row['group_id'] !== null ? (int) $row['group_id'] : null,
            $row['qualifies_count'] !== null ? (int) $row['qualifies_count'] : null,
            $row['eliminates_count'] !== null ? (int) $row['eliminates_count'] : null,
            $row['target_stage_id'] !== null ? (int) $row['target_stage_id'] : null,
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
            'stage_id'         => $this->stageId,
            'group_id'         => $this->groupId,
            'qualifies_count'  => $this->qualifiesCount,
            'eliminates_count' => $this->eliminatesCount,
            'target_stage_id'  => $this->targetStageId,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
