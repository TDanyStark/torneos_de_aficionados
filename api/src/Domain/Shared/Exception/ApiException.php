<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exception;

use RuntimeException;
use Throwable;

/**
 * Base exception for the API. Carries an HTTP status code and an optional
 * map of field-level validation errors. The error handler renders these
 * into the standard JSON error envelope.
 */
class ApiException extends RuntimeException
{
    /** @var array<string,string> */
    private array $errors;

    /**
     * @param array<string,string> $errors
     */
    public function __construct(
        string $message,
        int $statusCode = 400,
        array $errors = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $statusCode, $previous);
        $this->errors = $errors;
    }

    public function getStatusCode(): int
    {
        return $this->getCode() > 0 ? (int) $this->getCode() : 500;
    }

    /**
     * @return array<string,string>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
