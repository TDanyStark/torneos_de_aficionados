<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

/**
 * 403 Forbidden (authenticated but lacking permission).
 */
final class ForbiddenException extends ApiException
{
    public function __construct(string $message = 'No tienes permiso para realizar esta acción.')
    {
        parent::__construct($message, 403);
    }
}
