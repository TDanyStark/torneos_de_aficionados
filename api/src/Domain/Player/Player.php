<?php

declare(strict_types=1);

namespace App\Domain\Player;

use JsonSerializable;

/**
 * Player in an organizer-private pool. Identity is the cédula (document_id),
 * unique per organizer (organizer_user_id). Reused across the organizer's
 * tournaments so personal data is only captured once.
 */
final class Player implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $organizerUserId,
        public readonly ?int $userId,
        public readonly string $documentId,
        public readonly string $fullName,
        public readonly ?string $alias,
        public readonly ?string $birthdate,
        public readonly ?string $photoUrl,
        public readonly ?string $phone,
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
            (int) $row['organizer_user_id'],
            $row['user_id'] !== null ? (int) $row['user_id'] : null,
            (string) $row['document_id'],
            (string) $row['full_name'],
            isset($row['alias']) && $row['alias'] !== null ? (string) $row['alias'] : null,
            $row['birthdate'] !== null ? (string) $row['birthdate'] : null,
            $row['photo_url'] !== null ? (string) $row['photo_url'] : null,
            $row['phone'] !== null ? (string) $row['phone'] : null,
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
            'id'                => $this->id,
            'organizer_user_id' => $this->organizerUserId,
            'user_id'           => $this->userId,
            'document_id'       => $this->documentId,
            'full_name'         => $this->fullName,
            'alias'             => $this->alias,
            'birthdate'         => $this->birthdate,
            'photo_url'         => $this->photoUrl,
            'phone'             => $this->phone,
            'created_at'        => $this->createdAt,
            'updated_at'        => $this->updatedAt,
        ];
    }
}
