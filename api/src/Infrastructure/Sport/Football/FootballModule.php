<?php

declare(strict_types=1);

namespace App\Infrastructure\Sport\Football;

use App\Domain\Sport\Contracts\SportModule;

/**
 * Football sport module (covers 11/8/5/micro variants). Phase 1 skeleton;
 * live-match recording, scoring and standings strategy arrive in Phase 5.
 */
final class FootballModule implements SportModule
{
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
}
