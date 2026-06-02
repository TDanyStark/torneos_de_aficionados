<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use App\Domain\Fixture\Dto\Pairing;
use App\Domain\Fixture\Dto\RoundPlan;

/**
 * Round-robin scheduler using the circle method. PURE & deterministic.
 *
 *  - Even N  -> N-1 rounds, everyone plays everyone exactly once (single leg).
 *  - Odd  N  -> N rounds, one "bye" per round (each team byes exactly once).
 *  - legs=2  -> the rounds are duplicated as a second leg with home/away
 *               inverted, appended after the first-leg rounds.
 *
 * Output: an ordered list of RoundPlan (round numbers are 1-based and
 * contiguous). Pairing ordering within a round is deterministic.
 */
final class RoundRobinScheduler
{
    private const BYE = null;

    /**
     * @param array<int,int> $teamIds  team ids (ordering is respected as the seed)
     * @param int            $legs      1 = single round-robin, 2 = home & away
     * @param int|null       $groupId   optional group scope stamped on each round
     * @param int            $startNumber first round number (default 1)
     *
     * @return array<int,RoundPlan>
     */
    public function schedule(
        array $teamIds,
        int $legs = 1,
        ?int $groupId = null,
        int $startNumber = 1
    ): array {
        $teams = array_values(array_map('intval', $teamIds));

        if (count($teams) < 2) {
            return [];
        }

        $legs = max(1, $legs);

        $firstLeg = $this->buildSingleRoundRobin($teams);

        $rounds = [];
        $number = $startNumber;

        // Leg 1 (as computed).
        foreach ($firstLeg as $roundPairings) {
            $rounds[] = new RoundPlan($number, $this->toPairings($roundPairings, 1), $groupId, null, 1);
            $number++;
        }

        // Subsequent legs: invert home/away each odd leg.
        for ($leg = 2; $leg <= $legs; $leg++) {
            $invert = ($leg % 2 === 0); // leg 2 inverts, leg 3 back to original, etc.
            foreach ($firstLeg as $roundPairings) {
                $rounds[] = new RoundPlan(
                    $number,
                    $this->toPairings($roundPairings, $leg, $invert),
                    $groupId,
                    null,
                    $leg
                );
                $number++;
            }
        }

        return $rounds;
    }

    /**
     * Circle method. Returns rounds as arrays of [home, away] int|null pairs.
     *
     * @param array<int,int> $teams
     *
     * @return array<int,array<int,array{0:int|null,1:int|null}>>
     */
    private function buildSingleRoundRobin(array $teams): array
    {
        $list = $teams;

        // Odd count -> add a bye placeholder so we always pair an even set.
        $hasBye = false;
        if (count($list) % 2 !== 0) {
            $list[] = self::BYE;
            $hasBye = true;
        }

        $n = count($list);
        $roundsCount = $n - 1;
        $half = intdiv($n, 2);

        // Fixed pivot (first element); the rest rotate clockwise.
        $fixed = $list[0];
        $rotating = array_slice($list, 1);

        $rounds = [];

        for ($r = 0; $r < $roundsCount; $r++) {
            $arrangement = array_merge([$fixed], $rotating);
            $pairs = [];

            for ($i = 0; $i < $half; $i++) {
                $home = $arrangement[$i];
                $away = $arrangement[$n - 1 - $i];

                // Alternate home/away by round to balance home games across teams.
                if ($r % 2 === 1) {
                    [$home, $away] = [$away, $home];
                }

                $pairs[] = [$home, $away];
            }

            $rounds[] = $pairs;

            // Rotate the rotating part clockwise by one.
            array_unshift($rotating, array_pop($rotating));
        }

        unset($hasBye);

        return $rounds;
    }

    /**
     * @param array<int,array{0:int|null,1:int|null}> $roundPairings
     *
     * @return array<int,Pairing>
     */
    private function toPairings(array $roundPairings, int $leg, bool $invert = false): array
    {
        $pairings = [];
        foreach ($roundPairings as [$home, $away]) {
            if ($invert) {
                [$home, $away] = [$away, $home];
            }
            $pairings[] = new Pairing($home, $away, $leg);
        }

        return $pairings;
    }
}
