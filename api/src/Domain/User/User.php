<?php

declare(strict_types=1);

namespace App\Domain\User;

use JsonSerializable;

/**
 * User entity (global account). Roles are contextual per tournament and live
 * elsewhere; only is_admin is global.
 */
final class User implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $phone,
        public readonly bool $isAdmin,
        public readonly ?string $avatarUrl,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        return new self(
            (int) $row['id'],
            (string) $row['name'],
            (string) $row['email'],
            $row['phone'] !== null ? (string) $row['phone'] : null,
            (bool) $row['is_admin'],
            $row['avatar_url'] !== null ? (string) $row['avatar_url'] : null,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'phone'      => $this->phone,
            'is_admin'   => $this->isAdmin,
            'avatar_url' => $this->avatarUrl,
        ];
    }
}
