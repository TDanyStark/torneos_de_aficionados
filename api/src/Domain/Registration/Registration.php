<?php

declare(strict_types=1);

namespace App\Domain\Registration;

use JsonSerializable;

/**
 * Team registration into a tournament. Two channels: manual (organizer) and
 * self_link (delegate via code). Status flows submitted/pending -> approved/
 * rejected. Late registrations carry is_late + joined_at_round for Fase 4.
 */
final class Registration implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $tournamentId,
        public readonly int $tournamentTeamId,
        public readonly string $channel,
        public readonly string $status,
        public readonly bool $isLate,
        public readonly ?int $joinedAtRound,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
        // Joined team data (read-only convenience for the inbox listing).
        public readonly ?string $teamName = null,
        public readonly ?string $teamStatus = null,
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
            (int) $row['tournament_team_id'],
            (string) $row['channel'],
            (string) $row['status'],
            (bool) $row['is_late'],
            $row['joined_at_round'] !== null ? (int) $row['joined_at_round'] : null,
            isset($row['created_at']) ? (string) $row['created_at'] : null,
            isset($row['updated_at']) ? (string) $row['updated_at'] : null,
            isset($row['team_name']) && $row['team_name'] !== null ? (string) $row['team_name'] : null,
            isset($row['team_status']) && $row['team_status'] !== null ? (string) $row['team_status'] : null,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                 => $this->id,
            'tournament_id'      => $this->tournamentId,
            'tournament_team_id' => $this->tournamentTeamId,
            'channel'            => $this->channel,
            'status'             => $this->status,
            'is_late'            => $this->isLate,
            'joined_at_round'    => $this->joinedAtRound,
            'team_name'          => $this->teamName,
            'team_status'        => $this->teamStatus,
            'created_at'         => $this->createdAt,
            'updated_at'         => $this->updatedAt,
        ];
    }
}
