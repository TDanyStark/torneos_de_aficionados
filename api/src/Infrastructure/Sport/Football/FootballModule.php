<?php

declare(strict_types=1);

namespace App\Infrastructure\Sport\Football;

use App\Domain\Sport\Contracts\SportModule;
use App\Domain\Sport\Contracts\StandingsStrategy;

/**
 * Football sport module (covers 11/8/5/micro variants). Standings strategy
 * arrives in Phase 4; live-match recording arrives in Phase 5.
 */
final class FootballModule implements SportModule
{
    private ?StandingsStrategy $standingsStrategy = null;

    public function key(): string
    {
        return 'football';
    }

    public function label(): string
    {
        return 'Fútbol';
    }

    public function eventTypes(): array
    {
        return [
            'goal',
            'own_goal',
            'yellow_card',
            'red_card',
            'period_start',
            'period_end',
        ];
    }

    public function allowsDraws(): bool
    {
        return true;
    }

    public function standingsStrategy(): StandingsStrategy
    {
        return $this->standingsStrategy ??= new FootballStandingsStrategy();
    }
}
