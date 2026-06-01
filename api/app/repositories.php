<?php

declare(strict_types=1);

use App\Domain\AdvancementRule\AdvancementRuleRepository;
use App\Domain\Group\GroupRepository;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Sport\SportRepository;
use App\Domain\Stage\StageRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\UserRepository;
use App\Infrastructure\Persistence\AdvancementRule\PdoAdvancementRuleRepository;
use App\Infrastructure\Persistence\Group\PdoGroupRepository;
use App\Infrastructure\Persistence\Role\PdoTournamentUserRoleRepository;
use App\Infrastructure\Persistence\Sport\PdoSportRepository;
use App\Infrastructure\Persistence\Stage\PdoStageRepository;
use App\Infrastructure\Persistence\Tournament\PdoTournamentRepository;
use App\Infrastructure\Persistence\User\PdoUserRepository;
use DI\ContainerBuilder;

return function (ContainerBuilder $containerBuilder) {
    // Map domain repository interfaces to their MySQL (PDO) implementations.
    $containerBuilder->addDefinitions([
        UserRepository::class               => \DI\autowire(PdoUserRepository::class),
        SportRepository::class              => \DI\autowire(PdoSportRepository::class),
        TournamentRepository::class         => \DI\autowire(PdoTournamentRepository::class),
        TournamentUserRoleRepository::class => \DI\autowire(PdoTournamentUserRoleRepository::class),
        StageRepository::class              => \DI\autowire(PdoStageRepository::class),
        GroupRepository::class              => \DI\autowire(PdoGroupRepository::class),
        AdvancementRuleRepository::class    => \DI\autowire(PdoAdvancementRuleRepository::class),
    ]);
};
