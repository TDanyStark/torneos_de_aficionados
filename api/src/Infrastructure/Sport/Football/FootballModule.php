<?php

declare(strict_types=1);

namespace App\Infrastructure\Sport\Football;

use App\Domain\Live\LiveScoreCalculator;
use App\Domain\Live\MatchResultConsolidator;
use App\Domain\Sport\Contracts\SportModule;
use App\Domain\Sport\Contracts\StandingsStrategy;

/**
 * Football sport module (covers 11/8/5/micro variants). Standings strategy
 * (Phase 4) and live-match scoring (Phase 5) are delegated to pure Domain
 * calculators so this module holds no I/O.
 */
final class FootballModule implements SportModule
{
    private ?StandingsStrategy $standingsStrategy = null;
    private ?LiveScoreCalculator $liveScoreCalculator = null;
    private ?MatchResultConsolidator $resultConsolidator = null;

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

    /**
     * @param array<int,array<string,mixed>|object> $events
     *
     * @return array{home:int,away:int}
     */
    public function liveScore(array $events, ?int $homeTeamId, ?int $awayTeamId): array
    {
        $calculator = $this->liveScoreCalculator ??= new LiveScoreCalculator();

        return $calculator->calculate($events, $homeTeamId, $awayTeamId);
    }

    /**
     * @return array{home_score:int,away_score:int,winner_team_id:?int}
     */
    public function consolidateResult(
        int $home,
        int $away,
        ?int $homeTeamId,
        ?int $awayTeamId
    ): array {
        $consolidator = $this->resultConsolidator ??= new MatchResultConsolidator();

        return $consolidator->consolidate(
            $home,
            $away,
            $homeTeamId,
            $awayTeamId,
            $this->allowsDraws()
        );
    }
}
