<?php

declare(strict_types=1);

namespace App\Application\Handlers;

use App\Domain\Shared\Exception\ApiException;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpException;
use Slim\Handlers\ErrorHandler as SlimErrorHandler;
use Throwable;

class HttpErrorHandler extends SlimErrorHandler
{
    /**
     * @inheritdoc
     */
    protected function respond(): Response
    {
        $exception = $this->exception;

        // Domain/API exceptions render the standard contract envelope.
        if ($exception instanceof ApiException) {
            return $this->respondWithApiEnvelope(
                $exception->getStatusCode(),
                $exception->getMessage(),
                $exception->getErrors()
            );
        }
        $statusCode = 500;
        $message = 'Ocurrió un error interno al procesar la solicitud.';

        if ($exception instanceof HttpException) {
            $statusCode = $exception->getCode();
            $message = $exception->getMessage();
        } elseif ($exception instanceof Throwable && $this->displayErrorDetails) {
            // Never leak stack traces; only the message in debug mode.
            $message = $exception->getMessage();
        }

        return $this->respondWithApiEnvelope($statusCode, $message);
    }

    /**
     * Renders the standard API error envelope: { success:false, message, errors? }.
     *
     * @param array<string,string> $errors
     */
    private function respondWithApiEnvelope(int $statusCode, string $message, array $errors = []): Response
    {
        $payload = ['success' => false, 'message' => $message];
        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        $response = $this->responseFactory->createResponse($statusCode);
        $response->getBody()->write(
            (string) json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    }
}
