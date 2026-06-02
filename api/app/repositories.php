<?php

declare(strict_types=1);

use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Ad\AdSlotRepository;
use App\Domain\AdvancementRule\AdvancementRuleRepository;
use App\Domain\Fixture\BracketSlotRepository;
use App\Domain\Fixture\MatchEventRepository;
use App\Domain\Fixture\MatchPeriodRepository;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Fixture\RoundRepository;
use App\Domain\Group\GroupRepository;
use App\Domain\GroupTeam\GroupTeamRepository;
use App\Domain\Player\PlayerRepository;
use App\Domain\Referee\RefereeRepository;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Sport\SportRepository;
use App\Domain\Stage\StageRepository;
use App\Domain\Team\TeamRepository;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\UserRepository;
use App\Infrastructure\Persistence\Ad\PdoAdCreativeRepository;
use App\Infrastructure\Persistence\Ad\PdoAdSlotRepository;
use App\Infrastructure\Persistence\AdvancementRule\PdoAdvancementRuleRepository;
use App\Infrastructure\Persistence\Fixture\PdoBracketSlotRepository;
use App\Infrastructure\Persistence\Fixture\PdoMatchEventRepository;
use App\Infrastructure\Persistence\Fixture\PdoMatchPeriodRepository;
use App\Infrastructure\Persistence\Fixture\PdoMatchRepository;
use App\Infrastructure\Persistence\Fixture\PdoRoundRepository;
use App\Infrastructure\Persistence\Group\PdoGroupRepository;
use App\Infrastructure\Persistence\GroupTeam\PdoGroupTeamRepository;
use App\Infrastructure\Persistence\Player\PdoPlayerRepository;
use App\Infrastructure\Persistence\Referee\PdoRefereeRepository;
use App\Infrastructure\Persistence\Registration\PdoRegistrationRepository;
use App\Infrastructure\Persistence\Role\PdoTournamentUserRoleRepository;
use App\Infrastructure\Persistence\Sport\PdoSportRepository;
use App\Infrastructure\Persistence\Stage\PdoStageRepository;
use App\Infrastructure\Persistence\Team\PdoTeamRepository;
use App\Infrastructure\Persistence\TeamPlayer\PdoTeamPlayerRepository;
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
        TeamRepository::class               => \DI\autowire(PdoTeamRepository::class),
        PlayerRepository::class             => \DI\autowire(PdoPlayerRepository::class),
        TeamPlayerRepository::class         => \DI\autowire(PdoTeamPlayerRepository::class),
        RegistrationRepository::class       => \DI\autowire(PdoRegistrationRepository::class),
        RefereeRepository::class            => \DI\autowire(PdoRefereeRepository::class),
        GroupTeamRepository::class          => \DI\autowire(PdoGroupTeamRepository::class),
        RoundRepository::class              => \DI\autowire(PdoRoundRepository::class),
        MatchRepository::class              => \DI\autowire(PdoMatchRepository::class),
        BracketSlotRepository::class        => \DI\autowire(PdoBracketSlotRepository::class),
        MatchPeriodRepository::class        => \DI\autowire(PdoMatchPeriodRepository::class),
        MatchEventRepository::class         => \DI\autowire(PdoMatchEventRepository::class),
        AdSlotRepository::class             => \DI\autowire(PdoAdSlotRepository::class),
        AdCreativeRepository::class         => \DI\autowire(PdoAdCreativeRepository::class),
    ]);
};
