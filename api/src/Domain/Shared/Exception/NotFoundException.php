<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

/**
 * 404 Not Found.
 */
final class NotFoundException extends ApiException
{
    public function __construct(string $message = 'Recurso no encontrado.')
    {
        parent::__construct($message, 404);
    }
}
