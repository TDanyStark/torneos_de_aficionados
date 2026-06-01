<?php

declare(strict_types=1);

namespace App\Infrastructure\Auth;

use App\Domain\User\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

/**
 * Issues and validates JWTs (HS256).
 */
final class JwtService
{
    private const ALGO = 'HS256';

    public function __construct(
        private string $secret,
        private int $ttl
    ) {
    }

    public function issue(User $user): string
    {
        $now = time();

        $payload = [
            'sub'      => $user->id,
            'email'    => $user->email,
            'is_admin' => $user->isAdmin,
            'iat'      => $now,
            'exp'      => $now + $this->ttl,
        ];

        return JWT::encode($payload, $this->secret, self::ALGO);
    }

    /**
     * Returns the decoded payload as an array, or null if invalid/expired.
     *
     * @return array<string,mixed>|null
     */
    public function validate(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, self::ALGO));

            return (array) $decoded;
        } catch (Throwable $e) {
            return null;
        }
    }

    public function ttl(): int
    {
        return $this->ttl;
    }
}
