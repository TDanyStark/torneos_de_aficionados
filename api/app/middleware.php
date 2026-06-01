<?php

declare(strict_types=1);

use App\Application\Middleware\CorsMiddleware;
use Slim\App;

return function (App $app) {
    // CORS runs outermost so even error responses carry the headers.
    $app->add(CorsMiddleware::class);
};
