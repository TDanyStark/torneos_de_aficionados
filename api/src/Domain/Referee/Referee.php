<?php

declare(strict_types=1);

namespace App\Domain\Referee;

use JsonSerializable;

/**
 * Referee (árbitro) — a per-tournament directory entry. NAME ONLY, with no user
 * account. Many referees may belong to a tournament. The name is printed on the
 * match sheet (matches.referee_id), which is DISTINCT from referee_user_id (the
 * user account that controls the live match).
 */
final class Referee implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $tournamentId,
        public readonly string $name,
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
            'created_at'    => $this->createdAt,
            'updated_at'    => $this->updatedAt,
        ];
    }
}
