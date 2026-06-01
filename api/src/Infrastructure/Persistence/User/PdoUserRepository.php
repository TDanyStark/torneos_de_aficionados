<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\User;

use App\Domain\User\User;
use App\Domain\User\UserRepository;
use PDO;

final class PdoUserRepository implements UserRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?User
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? User::fromRow($row) : null;
    }

    public function findRowByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function emailExists(string $email): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);

        return (bool) $stmt->fetchColumn();
    }

    public function create(string $name, string $email, ?string $phone, string $passwordHash): User
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (name, email, phone, password_hash, is_admin, created_at, updated_at)
             VALUES (:name, :email, :phone, :password_hash, 0, NOW(), NOW())'
        );
        $stmt->execute([
            'name'          => $name,
            'email'         => $email,
            'phone'         => $phone,
            'password_hash' => $passwordHash,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        return new User($id, $name, $email, $phone, false, null);
    }
}
