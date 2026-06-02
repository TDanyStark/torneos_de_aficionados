<?php

declare(strict_types=1);

use App\Application\Settings\Settings;
use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;
use Monolog\Logger;

require __DIR__ . '/env.php';

return function (ContainerBuilder $containerBuilder) {

    // Global Settings Object
    $containerBuilder->addDefinitions([
        SettingsInterface::class => function () {
            $appEnv = (string) env('APP_ENV', 'production');
            $debug  = (bool) env('APP_DEBUG', $appEnv !== 'production');

            return new Settings([
                'displayErrorDetails' => $debug,
                'logError'            => true,
                'logErrorDetails'     => $debug,
                'appEnv'              => $appEnv,
                'logger' => [
                    'name' => 'slim-app',
                    'path' => isset($_ENV['docker']) ? 'php://stdout' : __DIR__ . '/../logs/app.log',
                    'level' => Logger::DEBUG,
                ],
                'db' => [
                    'host'    => (string) env('DB_HOST', 'localhost'),
                    'port'    => (int) env('DB_PORT', 3306),
                    'name'    => (string) env('DB_NAME', 'torneos_de_aficionados'),
                    'user'    => (string) env('DB_USER', 'root'),
                    'pass'    => (string) env('DB_PASS', ''),
                    'charset' => (string) env('DB_CHARSET', 'utf8mb4'),
                ],
                'jwt' => [
                    'secret' => (string) env('JWT_SECRET', 'insecure-development-secret'),
                    'ttl'    => (int) env('JWT_TTL', 3600),
                ],
                'cors' => [
                    'allowOrigin' => (string) env('CORS_ALLOW_ORIGIN', '*'),
                ],
                'adminWhatsapp' => (string) env('ADMIN_WHATSAPP', ''),
                'appUrl'        => rtrim((string) env('APP_URL', ''), '/'),
            ]);
        }
    ]);
};
