<?php

declare(strict_types=1);

namespace App\Domain\Role;

use JsonSerializable;

/**
 * Association of a user to a tournament with a contextual role
 * (organizer | referee | delegate | player). team_id is optional and only
 * relevant for players (FK to tournament_teams arrives in Phase 3).
 */
final class TournamentUserRole implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $tournamentId,
        public readonly int $userId,
        public readonly string $role,
        public readonly ?int $teamId,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
        // Optional enriched fields (present when joined with users).
        public readonly ?string $userName = null,
        public readonly ?string $userEmail = null,
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
            (int) $row['user_id'],
            (string) $row['role'],
            isset($row['team_id']) && $row['team_id'] !== null ? (int) $row['team_id'] : null,
            isset($row['created_at']) ? (string) $row['created_at'] : null,
            isset($row['updated_at']) ? (string) $row['updated_at'] : null,
            isset($row['user_name']) && $row['user_name'] !== null ? (string) $row['user_name'] : null,
            isset($row['user_email']) && $row['user_email'] !== null ? (string) $row['user_email'] : null,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        $data = [
            'id'            => $this->id,
            'tournament_id' => $this->tournamentId,
            'user_id'       => $this->userId,
            'role'          => $this->role,
            'team_id'       => $this->teamId,
            'created_at'    => $this->createdAt,
            'updated_at'    => $this->updatedAt,
        ];

        if ($this->userName !== null) {
            $data['user_name'] = $this->userName;
        }
        if ($this->userEmail !== null) {
            $data['user_email'] = $this->userEmail;
        }

        return $data;
    }
}
