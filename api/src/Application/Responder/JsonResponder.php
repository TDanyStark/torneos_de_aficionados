<?php

declare(strict_types=1);

namespace App\Application\Responder;

use Psr\Http\Message\ResponseInterface as Response;

/**
 * Emits the standard JSON response envelopes defined in the API contract:
 *   success:  { "success": true, "data": ... , "meta"?: ... }
 *   error:    { "success": false, "message": ..., "errors"?: ... }
 */
final class JsonResponder
{
    /**
     * @param mixed $data
     */
    public function success(Response $response, $data, int $status = 200): Response
    {
        return $this->write($response, ['success' => true, 'data' => $data], $status);
    }

    /**
     * @param mixed $data
     */
    public function created(Response $response, $data): Response
    {
        return $this->success($response, $data, 201);
    }

    public function noContent(Response $response): Response
    {
        return $response->withStatus(204);
    }

    /**
     * @param array<int,mixed> $items
     * @param array{page:int,per_page:int,total:int,total_pages:int,has_next:bool} $pagination
     */
    public function paginated(Response $response, array $items, array $pagination, int $status = 200): Response
    {
        return $this->write($response, [
            'success' => true,
            'data'    => $items,
            'meta'    => ['pagination' => $pagination],
        ], $status);
    }

    /**
     * @param array<string,string> $errors
     */
    public function error(Response $response, string $message, int $status = 400, array $errors = []): Response
    {
        $payload = ['success' => false, 'message' => $message];
        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        return $this->write($response, $payload, $status);
    }

    /**
     * @param array<string,mixed> $payload
     */
    private function write(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(
            (string) json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        return $response
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withStatus($status);
    }
}
