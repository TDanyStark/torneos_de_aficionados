<?php

declare(strict_types=1);

namespace App\Domain\User;

/**
 * Contract for user persistence. Implemented in Infrastructure.
 */
interface UserRepository
{
    public function findById(int $id): ?User;

    /**
     * Returns the raw row (incl. password_hash) for credential checks, or null.
     *
     * @return array<string,mixed>|null
     */
    public function findRowByEmail(string $email): ?array;

    public function emailExists(string $email): bool;

    /**
     * Creates a user and returns the new entity.
     */
    public function create(string $name, string $email, ?string $phone, string $passwordHash): User;
}
