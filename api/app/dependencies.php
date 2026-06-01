<?php

declare(strict_types=1);

use App\Application\Responder\JsonResponder;
use App\Application\Settings\SettingsInterface;
use App\Domain\Sport\SportModuleRegistry;
use App\Infrastructure\Auth\JwtService;
use App\Infrastructure\Database\PdoFactory;
use App\Infrastructure\Sport\Football\FootballModule;
use DI\ContainerBuilder;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\UidProcessor;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        LoggerInterface::class => function (ContainerInterface $c) {
            $settings = $c->get(SettingsInterface::class);

            $loggerSettings = $settings->get('logger');
            $logger = new Logger($loggerSettings['name']);

            $processor = new UidProcessor();
            $logger->pushProcessor($processor);

            $handler = new StreamHandler($loggerSettings['path'], $loggerSettings['level']);
            $logger->pushHandler($handler);

            return $logger;
        },

        PDO::class => function (ContainerInterface $c) {
            $settings = $c->get(SettingsInterface::class);

            return PdoFactory::create($settings->get('db'));
        },

        JsonResponder::class => function () {
            return new JsonResponder();
        },

        JwtService::class => function (ContainerInterface $c) {
            $jwt = $c->get(SettingsInterface::class)->get('jwt');

            return new JwtService($jwt['secret'], (int) $jwt['ttl']);
        },

        SportModuleRegistry::class => function () {
            // Register all installed sport modules here. MVP ships football only.
            return new SportModuleRegistry([
                new FootballModule(),
            ]);
        },
    ]);
};
