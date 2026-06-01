<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use App\Domain\Shared\Exception\UnauthorizedException;
use App\Domain\User\UserRepository;
use App\Infrastructure\Auth\JwtService;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * Validates the Bearer JWT, loads the user and injects it into the request
 * as the "user" attribute. Throws 401 when missing/invalid.
 */
final class JwtAuthMiddleware implements MiddlewareInterface
{
    public function __construct(
        private JwtService $jwt,
        private UserRepository $users
    ) {
    }

    public function process(Request $request, Handler $handler): Response
    {
        $header = $request->getHeaderLine('Authorization');

        if ($header === '' || !preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
            throw new UnauthorizedException('Token de autenticación ausente.');
        }

        $payload = $this->jwt->validate($m[1]);
        if ($payload === null || !isset($payload['sub'])) {
            throw new UnauthorizedException('Token inválido o expirado.');
        }

        $user = $this->users->findById((int) $payload['sub']);
        if ($user === null) {
            throw new UnauthorizedException('Usuario no encontrado.');
        }

        $request = $request
            ->withAttribute('user', $user)
            ->withAttribute('userId', $user->id);

        return $handler->handle($request);
    }
}
