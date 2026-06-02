<?php

declare(strict_types=1);

namespace App\Domain\GroupTeam;

use JsonSerializable;

/**
 * Assignment of a tournament team to a group (deferred from Fase 2). Unique per
 * (group, team).
 */
final class GroupTeam implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $groupId,
        public readonly int $tournamentTeamId,
        public readonly ?int $seed,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
        // Joined team data (read-only convenience).
        public readonly ?string $teamName = null,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        return new self(
            (int) $row['id'],
            (int) $row['group_id'],
            (int) $row['tournament_team_id'],
            $row['seed'] !== null ? (int) $row['seed'] : null,
            isset($row['created_at']) ? (string) $row['created_at'] : null,
            isset($row['updated_at']) ? (string) $row['updated_at'] : null,
            isset($row['team_name']) && $row['team_name'] !== null ? (string) $row['team_name'] : null,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                 => $this->id,
            'group_id'           => $this->groupId,
            'tournament_team_id' => $this->tournamentTeamId,
            'seed'               => $this->seed,
            'team_name'          => $this->teamName,
            'created_at'         => $this->createdAt,
            'updated_at'         => $this->updatedAt,
        ];
    }
}
