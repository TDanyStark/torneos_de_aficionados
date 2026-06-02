<?php

declare(strict_types=1);

namespace App\Infrastructure\Sport\Football;

use App\Domain\Sport\Contracts\StandingsStrategy;
use App\Domain\Standings\MatchResult;
use App\Domain\Standings\StandingRow;
use App\Domain\Standings\StandingsConfig;

/**
 * Football standings: accumulate PJ/PG/PE/PP/GF/GC/DG/Pts from finished matches
 * and order by the configured tiebreakers. PURE — no DB, fully unit-testable.
 *
 * head_to_head is a mini-table computed among the currently-tied teams ONLY.
 */
final class FootballStandingsStrategy implements StandingsStrategy
{
    public function allowsDraws(): bool
    {
        return true;
    }

    /**
     * @param array<int,int>         $teamIds
     * @param array<int,MatchResult> $matches
     * @param array<int,string>      $teamNames
     *
     * @return array<int,StandingRow>
     */
    public function compute(
        array $teamIds,
        array $matches,
        StandingsConfig $config,
        array $teamNames = []
    ): array {
        $acc = $this->emptyAccumulator($teamIds);

        foreach ($matches as $match) {
            $this->applyMatch($acc, $match, $config);
        }

        // Build rows.
        $rows = [];
        foreach ($acc as $teamId => $m) {
            $rows[] = new StandingRow(
                $teamId,
                $m['played'],
                $m['won'],
                $m['drawn'],
                $m['lost'],
                $m['gf'],
                $m['gc'],
                $m['points'],
                null,
                $teamNames[$teamId] ?? null,
            );
        }

        // Order using the configured tiebreaker chain, then assign positions.
        usort(
            $rows,
            fn (StandingRow $a, StandingRow $b): int => $this->compareRows($a, $b, $config, $matches)
        );

        $positioned = [];
        foreach ($rows as $index => $row) {
            $positioned[] = $row->withPosition($index + 1);
        }

        return $positioned;
    }

    /**
     * @param array<int,int> $teamIds
     *
     * @return array<int,array<string,int>>
     */
    private function emptyAccumulator(array $teamIds): array
    {
        $acc = [];
        foreach ($teamIds as $teamId) {
            $acc[(int) $teamId] = [
                'played' => 0,
                'won'    => 0,
                'drawn'  => 0,
                'lost'   => 0,
                'gf'     => 0,
                'gc'     => 0,
                'points' => 0,
            ];
        }

        return $acc;
    }

    /**
     * @param array<int,array<string,int>> $acc
     */
    private function applyMatch(array &$acc, MatchResult $match, StandingsConfig $config): void
    {
        $home = $match->homeTeamId;
        $away = $match->awayTeamId;

        // Only count teams that belong to the table.
        if (!isset($acc[$home]) || !isset($acc[$away])) {
            return;
        }

        $acc[$home]['played']++;
        $acc[$away]['played']++;
        $acc[$home]['gf'] += $match->homeScore;
        $acc[$home]['gc'] += $match->awayScore;
        $acc[$away]['gf'] += $match->awayScore;
        $acc[$away]['gc'] += $match->homeScore;

        if ($match->homeScore > $match->awayScore) {
            $acc[$home]['won']++;
            $acc[$away]['lost']++;
            $acc[$home]['points'] += $config->pointsWin;
            $acc[$away]['points'] += $config->pointsLoss;
        } elseif ($match->homeScore < $match->awayScore) {
            $acc[$away]['won']++;
            $acc[$home]['lost']++;
            $acc[$away]['points'] += $config->pointsWin;
            $acc[$home]['points'] += $config->pointsLoss;
        } else {
            $acc[$home]['drawn']++;
            $acc[$away]['drawn']++;
            $acc[$home]['points'] += $config->pointsDraw;
            $acc[$away]['points'] += $config->pointsDraw;
        }
    }

    /**
     * Compares two rows across the configured tiebreaker chain. Returns <0 if $a
     * should rank ABOVE $b, >0 if below, 0 if still tied after all keys.
     *
     * @param array<int,MatchResult> $allMatches
     */
    private function compareRows(
        StandingRow $a,
        StandingRow $b,
        StandingsConfig $config,
        array $allMatches
    ): int {
        foreach ($config->tiebreakers as $key) {
            $cmp = $this->compareByKey($key, $a, $b, $allMatches);
            if ($cmp !== 0) {
                return $cmp;
            }
        }

        // Stable, deterministic final fallback: lower team id first.
        return $a->teamId <=> $b->teamId;
    }

    /**
     * @param array<int,MatchResult> $allMatches
     */
    private function compareByKey(
        string $key,
        StandingRow $a,
        StandingRow $b,
        array $allMatches
    ): int {
        switch ($key) {
            case 'points':
                return $b->points <=> $a->points;
            case 'goal_difference':
                return $b->goalDifference() <=> $a->goalDifference();
            case 'goals_for':
                return $b->goalsFor <=> $a->goalsFor;
            case 'goals_against':
                // Fewer goals against ranks higher.
                return $a->goalsAgainst <=> $b->goalsAgainst;
            case 'wins':
                return $b->won <=> $a->won;
            case 'head_to_head':
                return $this->compareHeadToHead($a->teamId, $b->teamId, $allMatches);
            default:
                return 0;
        }
    }

    /**
     * Mini-table head-to-head between exactly the two tied teams: only matches
     * BETWEEN them count. Ranks by points, then goal difference, then goals for
     * within that mini-table. Returns <0 if $aId ranks above $bId.
     *
     * @param array<int,MatchResult> $allMatches
     */
    private function compareHeadToHead(int $aId, int $bId, array $allMatches): int
    {
        $aPts = 0;
        $bPts = 0;
        $aGf = 0;
        $bGf = 0;

        foreach ($allMatches as $match) {
            $involvesPair =
                ($match->homeTeamId === $aId && $match->awayTeamId === $bId)
                || ($match->homeTeamId === $bId && $match->awayTeamId === $aId);

            if (!$involvesPair) {
                continue;
            }

            // Goals scored by each team in this head-to-head match.
            if ($match->homeTeamId === $aId) {
                $aGoals = $match->homeScore;
                $bGoals = $match->awayScore;
            } else {
                $aGoals = $match->awayScore;
                $bGoals = $match->homeScore;
            }

            $aGf += $aGoals;
            $bGf += $bGoals;

            if ($aGoals > $bGoals) {
                $aPts += 3;
            } elseif ($aGoals < $bGoals) {
                $bPts += 3;
            } else {
                $aPts += 1;
                $bPts += 1;
            }
        }

        if ($aPts !== $bPts) {
            return $bPts <=> $aPts;
        }

        $aDiff = $aGf - $bGf;
        $bDiff = $bGf - $aGf;
        if ($aDiff !== $bDiff) {
            return $bDiff <=> $aDiff;
        }

        return $bGf <=> $aGf;
    }
}
