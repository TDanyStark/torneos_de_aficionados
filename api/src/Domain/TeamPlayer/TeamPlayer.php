<?php

declare(strict_types=1);

namespace App\Domain\TeamPlayer;

use JsonSerializable;

/**
 * Roster entry: a player's membership in a concrete team, with shirt number,
 * position and flags. Shirt number is unique per team. Personal player data
 * (name, document, etc.) is joined from the players pool when available.
 */
final class TeamPlayer implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $tournamentTeamId,
        public readonly int $playerId,
        public readonly ?int $shirtNumber,
        public readonly ?string $position,
        public readonly bool $isCaptain,
        public readonly bool $isDelegate,
        public readonly string $status,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
        // Joined player data (read-only convenience for roster listings).
        public readonly ?string $documentId = null,
        public readonly ?string $fullName = null,
        public readonly ?string $alias = null,
        public readonly ?string $birthdate = null,
        public readonly ?string $photoUrl = null,
        public readonly ?string $phone = null,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        return new self(
            (int) $row['id'],
            (int) $row['tournament_team_id'],
            (int) $row['player_id'],
            $row['shirt_number'] !== null ? (int) $row['shirt_number'] : null,
            $row['position'] !== null ? (string) $row['position'] : null,
            (bool) $row['is_captain'],
            (bool) $row['is_delegate'],
            (string) $row['status'],
            isset($row['created_at']) ? (string) $row['created_at'] : null,
            isset($row['updated_at']) ? (string) $row['updated_at'] : null,
            isset($row['document_id']) && $row['document_id'] !== null ? (string) $row['document_id'] : null,
            isset($row['full_name']) && $row['full_name'] !== null ? (string) $row['full_name'] : null,
            isset($row['alias']) && $row['alias'] !== null ? (string) $row['alias'] : null,
            isset($row['birthdate']) && $row['birthdate'] !== null ? (string) $row['birthdate'] : null,
            isset($row['photo_url']) && $row['photo_url'] !== null ? (string) $row['photo_url'] : null,
            isset($row['phone']) && $row['phone'] !== null ? (string) $row['phone'] : null,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'                 => $this->id,
            'tournament_team_id' => $this->tournamentTeamId,
            'player_id'          => $this->playerId,
            'shirt_number'       => $this->shirtNumber,
            'position'           => $this->position,
            'is_captain'         => $this->isCaptain,
            'is_delegate'        => $this->isDelegate,
            'status'             => $this->status,
            'document_id'        => $this->documentId,
            'full_name'          => $this->fullName,
            'alias'              => $this->alias,
            'birthdate'          => $this->birthdate,
            'photo_url'          => $this->photoUrl,
            'phone'              => $this->phone,
            'created_at'         => $this->createdAt,
            'updated_at'         => $this->updatedAt,
        ];
    }
}
