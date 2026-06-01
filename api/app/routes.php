<?php

declare(strict_types=1);

use App\Application\Actions\Auth\LoginAction;
use App\Application\Actions\Auth\MeAction;
use App\Application\Actions\Auth\RegisterAction;
use App\Application\Actions\Health\HealthAction;
use App\Application\Middleware\JwtAuthMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

return function (App $app) {
    // CORS pre-flight handler.
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });

    $app->get('/', function (Request $request, Response $response) {
        $response->getBody()->write(
            (string) json_encode(['success' => true, 'data' => ['service' => 'torneos-api']])
        );
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    });

    // API v1
    $app->group('/api/v1', function (Group $group) {
        // Health (public)
        $group->get('/health', HealthAction::class);

        // Auth module
        $group->group('/auth', function (Group $auth) {
            $auth->post('/login', LoginAction::class);
            $auth->post('/register', RegisterAction::class);
            $auth->get('/me', MeAction::class)->add(JwtAuthMiddleware::class);
        });
    });
};
