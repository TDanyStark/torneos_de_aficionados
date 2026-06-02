<?php

declare(strict_types=1);

namespace App\Domain\Sport\Contracts;

use App\Domain\Standings\MatchResult;
use App\Domain\Standings\StandingRow;
use App\Domain\Standings\StandingsConfig;

/**
 * Sport-specific standings computation. The core (StandingsCalculator) owns the
 * table STRUCTURE (rows, order, positions) but delegates HOW points/metrics are
 * computed and how ties are broken to the sport module's strategy.
 *
 * Implementations MUST be PURE (no DB, no I/O) so they are unit-testable.
 */
interface StandingsStrategy
{
    /**
     * Computes ordered, positioned standing rows from a set of finished matches.
     *
     * @param array<int,int>          $teamIds   team ids that belong to the table
     *                                           (so teams with 0 matches still appear)
     * @param array<int,MatchResult>  $matches   only finished matches with scores
     * @param StandingsConfig         $config    points + ordered tiebreakers
     * @param array<int,string>       $teamNames optional teamId => name map
     *
     * @return array<int,StandingRow> ordered rows with 1-based positions
     */
    public function compute(
        array $teamIds,
        array $matches,
        StandingsConfig $config,
        array $teamNames = []
    ): array;

    /**
     * Whether draws are possible under this sport (affects PE/points).
     */
    public function allowsDraws(): bool;
}
