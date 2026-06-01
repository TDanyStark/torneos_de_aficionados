<?php

declare(strict_types=1);

namespace App\Application\Action;

use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\ApiException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Base class for API module actions. Provides request parsing helpers and a
 * standard execution wrapper that converts ApiException into the JSON error
 * envelope. Subclasses implement handle().
 */
abstract class ApiAction
{
    protected Request $request;
    protected Response $response;
    /** @var array<string,string> */
    protected array $args = [];

    public function __construct(protected JsonResponder $responder)
    {
    }

    /**
     * @param array<string,string> $args
     */
    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $this->request = $request;
        $this->response = $response;
        $this->args = $args;

        try {
            return $this->handle();
        } catch (ApiException $e) {
            return $this->responder->error(
                $response,
                $e->getMessage(),
                $e->getStatusCode(),
                $e->getErrors()
            );
        }
    }

    abstract protected function handle(): Response;

    /**
     * Parsed JSON/body as an associative array.
     *
     * @return array<string,mixed>
     */
    protected function body(): array
    {
        $parsed = $this->request->getParsedBody();

        return is_array($parsed) ? $parsed : [];
    }

    /**
     * @return array<string,mixed>
     */
    protected function query(): array
    {
        return $this->request->getQueryParams();
    }

    protected function arg(string $name, ?string $default = null): ?string
    {
        return $this->args[$name] ?? $default;
    }
}
