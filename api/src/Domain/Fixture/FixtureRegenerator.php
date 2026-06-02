<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use App\Domain\Fixture\Dto\ExistingMatch;
use App\Domain\Fixture\Dto\ExistingRound;
use App\Domain\Fixture\Dto\Pairing;
use App\Domain\Fixture\Dto\RegenerationPlan;
use App\Domain\Fixture\Dto\RoundPlan;

/**
 * Recomputes future rounds of a round-robin after a late team joins at round K.
 *
 * Guarantees (plan 07 §5):
 *  1. Rounds < K, and any consolidated round (played/in-progress) >= K, are
 *     PRESERVED untouched — their results are never altered.
 *  2. The remaining (unplayed) pairings of the FULL round-robin over
 *     (existing teams + new team), minus pairs already consolidated, are
 *     re-laid into contiguous future rounds starting at K.
 *  3. The new team gets matches against every existing team it has not yet
 *     consolidated a result with.
 *  4. IDEMPOTENT over the not-yet-played portion: re-running with the new team
 *     already present yields the same future plan.
 *
 * PURE — input/output are plain DTOs/arrays. No DB, no I/O.
 */
final class FixtureRegenerator
{
    /**
     * @param array<int,ExistingRound> $existingRounds existing rounds + matches
     * @param array<int,int>           $existingTeamIds all teams already in the stage/group
     * @param int                      $newTeamId       the late team (may already be in $existingTeamIds)
     * @param int                      $joinedAtRound   K — first round the new team participates in
     * @param int                      $legs            1 or 2
     * @param int|null                 $groupId         group scope stamped on new rounds
     */
    public function regenerate(
        array $existingRounds,
        array $existingTeamIds,
        int $newTeamId,
        int $joinedAtRound,
        int $legs = 1,
        ?int $groupId = null
    ): RegenerationPlan {
        // Full team roster including the late team (dedup, deterministic order).
        $teams = $this->mergeTeams($existingTeamIds, $newTeamId);

        // Partition existing rounds.
        $preservedRounds = [];
        $futureRounds = [];
        foreach ($existingRounds as $round) {
            if ($round->number < $joinedAtRound || $round->isConsolidated()) {
                $preservedRounds[] = $round;
            } else {
                $futureRounds[] = $round;
            }
        }

        // Pair keys already consolidated (must not be re-scheduled). We take
        // them from LOCKED matches anywhere (preserved rounds, or locked matches
        // that happen to live inside an otherwise-future round).
        $consolidatedPairs = $this->collectConsolidatedPairs($existingRounds);

        // All pairings of the full round-robin (deterministic), minus the ones
        // already consolidated. These are everything left to play.
        $remaining = $this->remainingPairings($teams, $legs, $consolidatedPairs);

        // Determine the starting round number for the rebuilt future block.
        $startNumber = $this->startNumber($preservedRounds, $joinedAtRound);

        // Greedily pack remaining pairings into contiguous rounds.
        $newFutureRounds = $this->packIntoRounds($remaining, $startNumber, $groupId);

        $preservedNumbers = array_map(
            static fn (ExistingRound $r): int => $r->number,
            $preservedRounds
        );
        sort($preservedNumbers);

        $removedRoundIds = [];
        foreach ($futureRounds as $round) {
            if ($round->id !== null) {
                $removedRoundIds[] = $round->id;
            }
        }

        $createdMatchCount = 0;
        foreach ($newFutureRounds as $round) {
            $createdMatchCount += count($round->matches());
        }

        return new RegenerationPlan(
            array_values($preservedNumbers),
            array_values($removedRoundIds),
            $newFutureRounds,
            $createdMatchCount,
        );
    }

    /**
     * @param array<int,int> $existingTeamIds
     *
     * @return array<int,int>
     */
    private function mergeTeams(array $existingTeamIds, int $newTeamId): array
    {
        $teams = array_map('intval', $existingTeamIds);
        if (!in_array($newTeamId, $teams, true)) {
            $teams[] = $newTeamId;
        }

        return array_values(array_unique($teams));
    }

    /**
     * @param array<int,ExistingRound> $existingRounds
     *
     * @return array<string,bool> pairKey => true
     */
    private function collectConsolidatedPairs(array $existingRounds): array
    {
        $pairs = [];
        foreach ($existingRounds as $round) {
            foreach ($round->matches as $match) {
                if (!$match->isLocked()) {
                    continue;
                }
                $key = $match->pairKey();
                if ($key !== null) {
                    $pairs[$key] = true;
                }
            }
        }

        return $pairs;
    }

    /**
     * Full single/double round-robin pairing list over $teams (using the
     * scheduler for a deterministic order), minus consolidated pairs.
     *
     * @param array<int,int>    $teams
     * @param array<string,bool> $consolidatedPairs
     *
     * @return array<int,Pairing>
     */
    private function remainingPairings(array $teams, int $legs, array $consolidatedPairs): array
    {
        $scheduler = new RoundRobinScheduler();
        $fullRounds = $scheduler->schedule($teams, $legs);

        $remaining = [];
        foreach ($fullRounds as $round) {
            foreach ($round->matches() as $pairing) {
                $key = $this->pairKey($pairing);
                if ($key !== null && isset($consolidatedPairs[$key])) {
                    continue;
                }
                $remaining[] = $pairing;
            }
        }

        return $remaining;
    }

    private function pairKey(Pairing $pairing): ?string
    {
        if ($pairing->isBye()) {
            return null;
        }

        $a = (int) $pairing->homeTeamId;
        $b = (int) $pairing->awayTeamId;
        [$lo, $hi] = $a <= $b ? [$a, $b] : [$b, $a];

        return $lo . '-' . $hi . ':leg' . $pairing->leg;
    }

    /**
     * @param array<int,ExistingRound> $preservedRounds
     */
    private function startNumber(array $preservedRounds, int $joinedAtRound): int
    {
        $maxPreserved = 0;
        foreach ($preservedRounds as $round) {
            $maxPreserved = max($maxPreserved, $round->number);
        }

        // Start right after the last preserved round, but never before K.
        return max($joinedAtRound, $maxPreserved + 1);
    }

    /**
     * Greedy round packing: place each remaining pairing into the earliest round
     * where neither team is already scheduled. Deterministic given the input
     * order (which comes from the scheduler). Produces contiguous round numbers.
     *
     * @param array<int,Pairing> $pairings
     *
     * @return array<int,RoundPlan>
     */
    private function packIntoRounds(array $pairings, int $startNumber, ?int $groupId): array
    {
        /** @var array<int,array<int,Pairing>> $buckets index => pairings */
        $buckets = [];
        /** @var array<int,array<int,bool>> $usedTeams index => teamId => true */
        $usedTeams = [];

        foreach ($pairings as $pairing) {
            $home = (int) $pairing->homeTeamId;
            $away = (int) $pairing->awayTeamId;

            $placed = false;
            $index = 0;
            while (!$placed) {
                if (!isset($buckets[$index])) {
                    $buckets[$index] = [];
                    $usedTeams[$index] = [];
                }

                if (!isset($usedTeams[$index][$home]) && !isset($usedTeams[$index][$away])) {
                    $buckets[$index][] = $pairing;
                    $usedTeams[$index][$home] = true;
                    $usedTeams[$index][$away] = true;
                    $placed = true;
                } else {
                    $index++;
                }
            }
        }

        $rounds = [];
        $number = $startNumber;
        foreach ($buckets as $bucketPairings) {
            if ($bucketPairings === []) {
                continue;
            }
            $rounds[] = new RoundPlan($number, array_values($bucketPairings), $groupId, null, 1);
            $number++;
        }

        return $rounds;
    }
}
