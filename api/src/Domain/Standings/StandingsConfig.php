<?php

declare(strict_types=1);

namespace App\Domain\Standings;

/**
 * Immutable scoring + tiebreaker configuration for a standings computation.
 * Sourced from tournaments.points_win/draw/loss and stages.tiebreakers. Pure DTO.
 *
 * Supported tiebreaker keys (applied in the given order):
 *  - 'points'
 *  - 'goal_difference'
 *  - 'goals_for'
 *  - 'goals_against'
 *  - 'wins'
 *  - 'head_to_head' (mini-table among the tied teams only)
 */
final class StandingsConfig
{
    public const DEFAULT_TIEBREAKERS = [
        'points',
        'goal_difference',
        'goals_for',
        'head_to_head',
    ];

    /**
     * @param array<int,string> $tiebreakers ordered list of tiebreaker keys
     */
    public function __construct(
        public readonly int $pointsWin = 3,
        public readonly int $pointsDraw = 1,
        public readonly int $pointsLoss = 0,
        public readonly array $tiebreakers = self::DEFAULT_TIEBREAKERS,
    ) {
    }

    /**
     * @param array<int,string>|null $tiebreakers
     */
    public static function create(
        int $pointsWin = 3,
        int $pointsDraw = 1,
        int $pointsLoss = 0,
        ?array $tiebreakers = null
    ): self {
        $list = array_values(array_filter(
            $tiebreakers ?? self::DEFAULT_TIEBREAKERS,
            static fn ($t): bool => is_string($t) && $t !== ''
        ));

        if ($list === []) {
            $list = self::DEFAULT_TIEBREAKERS;
        }

        return new self($pointsWin, $pointsDraw, $pointsLoss, $list);
    }
}
