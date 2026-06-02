<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use JsonSerializable;

/**
 * A bracket slot in a knockout stage. home_source/away_source encode origin
 * strings; next_slot_id chains the winner's advancement.
 */
final class BracketSlot implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $stageId,
        public readonly int $roundNumber,
        public readonly ?string $roundLabel,
        public readonly int $position,
        public readonly ?string $homeSource,
        public readonly ?string $awaySource,
        public readonly ?int $nextSlotId,
        public readonly ?int $matchId,
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
            (int) $row['round_number'],
            isset($row['round_label']) && $row['round_label'] !== null ? (string) $row['round_label'] : null,
            (int) $row['position'],
            isset($row['home_source']) && $row['home_source'] !== null ? (string) $row['home_source'] : null,
            isset($row['away_source']) && $row['away_source'] !== null ? (string) $row['away_source'] : null,
            isset($row['next_slot_id']) && $row['next_slot_id'] !== null ? (int) $row['next_slot_id'] : null,
            isset($row['match_id']) && $row['match_id'] !== null ? (int) $row['match_id'] : null,
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
            'id'           => $this->id,
            'stage_id'     => $this->stageId,
            'round_number' => $this->roundNumber,
            'round_label'  => $this->roundLabel,
            'position'     => $this->position,
            'home_source'  => $this->homeSource,
            'away_source'  => $this->awaySource,
            'next_slot_id' => $this->nextSlotId,
            'match_id'     => $this->matchId,
            'created_at'   => $this->createdAt,
            'updated_at'   => $this->updatedAt,
        ];
    }
}
