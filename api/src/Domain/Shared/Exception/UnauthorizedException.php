<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

/**
 * 401 Unauthorized (not authenticated).
 */
final class UnauthorizedException extends ApiException
{
    public function __construct(string $message = 'No autenticado.')
    {
        parent::__construct($message, 401);
    }
}
