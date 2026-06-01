<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

/**
 * 422 Unprocessable Entity. Carries field-level validation errors.
 */
final class ValidationException extends ApiException
{
    /**
     * @param array<string,string> $errors
     */
    public function __construct(array $errors, string $message = 'Los datos enviados no son válidos.')
    {
        parent::__construct($message, 422, $errors);
    }
}
