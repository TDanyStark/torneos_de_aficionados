<?php

declare(strict_types=1);

namespace App\Domain\Stage;

use JsonSerializable;

/**
 * Stage (fase) of a tournament: league, groups or knockout. Stages are ordered
 * by position and may define tiebreakers as a JSON-encoded ordered list.
 */
final class Stage implements JsonSerializable
{
    /**
     * @param array<int,string>|null $tiebreakers
     */
    public function __construct(
        public readonly int $id,
        public readonly int $tournamentId,
        public readonly string $name,
        public readonly string $type,
        public readonly int $position,
        public readonly int $legs,
        public readonly ?int $bracketSize,
        public readonly ?array $tiebreakers,
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
        $tiebreakers = null;
        if (isset($row['tiebreakers']) && $row['tiebreakers'] !== null && $row['tiebreakers'] !== '') {
            $decoded = json_decode((string) $row['tiebreakers'], true);
            $tiebreakers = is_array($decoded) ? $decoded : null;
        }

        return new self(
            (int) $row['id'],
            (int) $row['tournament_id'],
            (string) $row['name'],
            (string) $row['type'],
            (int) $row['position'],
            (int) $row['legs'],
            isset($row['bracket_size']) && $row['bracket_size'] !== null ? (int) $row['bracket_size'] : null,
            $tiebreakers,
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
            'id'            => $this->id,
            'tournament_id' => $this->tournamentId,
            'name'          => $this->name,
            'type'          => $this->type,
            'position'      => $this->position,
            'legs'          => $this->legs,
            'bracket_size'  => $this->bracketSize,
            'tiebreakers'   => $this->tiebreakers,
            'status'        => $this->status,
            'created_at'    => $this->createdAt,
            'updated_at'    => $this->updatedAt,
        ];
    }
}
