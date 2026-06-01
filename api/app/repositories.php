<?php

declare(strict_types=1);

use App\Domain\User\UserRepository;
use App\Infrastructure\Persistence\User\PdoUserRepository;
use DI\ContainerBuilder;

return function (ContainerBuilder $containerBuilder) {
    // Map domain repository interfaces to their MySQL (PDO) implementations.
    $containerBuilder->addDefinitions([
        UserRepository::class => \DI\autowire(PdoUserRepository::class),
    ]);
};
