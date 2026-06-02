<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\UnauthorizedException;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;

/**
 * Guards global-admin routes (publicidad management). Reads the "user" request
 * attribute injected by JwtAuthMiddleware and only lets users.is_admin through.
 *
 * Must run AFTER JwtAuthMiddleware (relies on the "user" attribute), so routes
 * wire it as:  ->add(AdminMiddleware::class)->add(JwtAuthMiddleware::class)
 * (reverse order => JwtAuth runs first, then Admin).
 *
 * Autowired by class (no DI entry needed): no constructor dependencies.
 */
final class AdminMiddleware implements MiddlewareInterface
{
    public function process(Request $request, Handler $handler): Response
    {
        /** @var User|null $user */
        $user = $request->getAttribute('user');

        if (!$user instanceof User) {
            throw new UnauthorizedException('Autenticación requerida.');
        }

        if (!$user->isAdmin) {
            throw new ForbiddenException('Solo un administrador puede gestionar la publicidad.');
        }

        return $handler->handle($request);
    }
}
