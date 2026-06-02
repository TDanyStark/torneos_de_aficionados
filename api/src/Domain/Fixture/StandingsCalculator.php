<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use App\Domain\Sport\Contracts\StandingsStrategy;
use App\Domain\Standings\MatchResult;
use App\Domain\Standings\StandingRow;
use App\Domain\Standings\StandingsConfig;

/**
 * Orchestrates standings: owns the table structure, delegates scoring/ordering
 * to the sport's StandingsStrategy. PURE — accepts raw arrays, returns DTOs.
 */
final class StandingsCalculator
{
    public function __construct(
        private readonly StandingsStrategy $strategy
    ) {
    }

    /**
     * Computes ordered standing rows for a set of teams from raw match rows.
     * Only FINISHED matches with both scores present contribute.
     *
     * @param array<int,int>             $teamIds
     * @param array<int,array<string,mixed>> $matchRows raw matches rows
     * @param array<int,string>          $teamNames teamId => name
     *
     * @return array<int,StandingRow>
     */
    public function calculate(
        array $teamIds,
        array $matchRows,
        StandingsConfig $config,
        array $teamNames = []
    ): array {
        $results = [];
        foreach ($matchRows as $row) {
            $result = $row instanceof MatchResult ? $row : MatchResult::fromRow($row);
            if ($result !== null) {
                $results[] = $result;
            }
        }

        return $this->strategy->compute($teamIds, $results, $config, $teamNames);
    }
}
