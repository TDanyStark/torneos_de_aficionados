<?php

declare(strict_types=1);

namespace Tests\Domain\Fixture;

use App\Domain\Fixture\Dto\ExistingMatch;
use App\Domain\Fixture\Dto\ExistingRound;
use App\Domain\Fixture\Dto\Pairing;
use App\Domain\Fixture\Dto\RegenerationPlan;
use App\Domain\Fixture\Dto\RoundPlan;
use App\Domain\Fixture\FixtureRegenerator;
use App\Domain\Fixture\RoundRobinScheduler;
use PHPUnit\Framework\TestCase;

final class FixtureRegeneratorTest extends TestCase
{
    private FixtureRegenerator $regenerator;

    protected function setUp(): void
    {
        $this->regenerator = new FixtureRegenerator();
    }

    /**
     * Builds existing rounds for a 4-team single round-robin, marking the first
     * (K-1) rounds as finished. Teams 1..4.
     *
     * @return array<int,ExistingRound>
     */
    private function buildPlayedRounds(int $playedThrough): array
    {
        $scheduler = new RoundRobinScheduler();
        $plan = $scheduler->schedule([1, 2, 3, 4], 1);

        $rounds = [];
        foreach ($plan as $i => $roundPlan) {
            $number = $roundPlan->number;
            $isPlayed = $number <= $playedThrough;

            $matches = [];
            foreach ($roundPlan->matches() as $j => $pairing) {
                $matches[] = new ExistingMatch(
                    1000 + $i * 10 + $j, // fake DB id
                    $pairing->homeTeamId,
                    $pairing->awayTeamId,
                    $isPlayed ? 'finished' : 'scheduled',
                    1
                );
            }

            $rounds[] = new ExistingRound(
                100 + $i, // fake round id
                $number,
                $matches,
                $isPlayed ? 'finished' : 'pending'
            );
        }

        return $rounds;
    }

    /**
     * @param array<int,RoundPlan> $rounds
     *
     * @return array<int,string> unordered pair keys
     */
    private function pairKeys(array $rounds): array
    {
        $keys = [];
        foreach ($rounds as $round) {
            foreach ($round->matches() as $m) {
                $a = (int) $m->homeTeamId;
                $b = (int) $m->awayTeamId;
                [$lo, $hi] = $a <= $b ? [$a, $b] : [$b, $a];
                $keys[] = $lo . '-' . $hi;
            }
        }

        return $keys;
    }

    public function testRoundsBeforeKArePreserved(): void
    {
        // 4 teams, rounds 1 and 2 finished, new team 5 joins at round K=3.
        $existing = $this->buildPlayedRounds(2);

        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        // Rounds 1 and 2 are preserved.
        self::assertSame([1, 2], $plan->preservedRoundNumbers);
    }

    public function testPlayedMatchesNeverAltered(): void
    {
        $existing = $this->buildPlayedRounds(2);

        // Collect the consolidated pair keys (rounds 1 & 2).
        $consolidated = [];
        foreach ($existing as $round) {
            if ($round->number > 2) {
                continue;
            }
            foreach ($round->matches as $m) {
                $a = (int) $m->homeTeamId;
                $b = (int) $m->awayTeamId;
                [$lo, $hi] = $a <= $b ? [$a, $b] : [$b, $a];
                $consolidated[$lo . '-' . $hi] = true;
            }
        }

        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        // None of the freshly planned future matches repeats a consolidated pair.
        foreach ($this->pairKeys($plan->futureRounds) as $key) {
            self::assertArrayNotHasKey(
                $key,
                $consolidated,
                "consolidated pair {$key} must not be rescheduled"
            );
        }
    }

    public function testNewTeamGetsMatchesAgainstAllExistingTeams(): void
    {
        // Nothing played yet, new team 5 joins at round 1.
        $existing = $this->buildPlayedRounds(0);

        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 1, 1);

        // Team 5 must face each of 1,2,3,4 exactly once.
        $opponentsOf5 = [];
        foreach ($plan->futureRounds as $round) {
            foreach ($round->matches() as $m) {
                if ($m->homeTeamId === 5) {
                    $opponentsOf5[] = $m->awayTeamId;
                } elseif ($m->awayTeamId === 5) {
                    $opponentsOf5[] = $m->homeTeamId;
                }
            }
        }
        sort($opponentsOf5);
        self::assertSame([1, 2, 3, 4], $opponentsOf5, 'new team faces every existing team once');
    }

    public function testNewTeamMissingMatchCountAfterTwoPlayedRounds(): void
    {
        // Rounds 1 & 2 finished; team 5 joins at round 3.
        $existing = $this->buildPlayedRounds(2);

        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        // Future matches involving team 5: it must play all 4 existing teams.
        $five = 0;
        foreach ($plan->futureRounds as $round) {
            foreach ($round->matches() as $m) {
                if ($m->homeTeamId === 5 || $m->awayTeamId === 5) {
                    $five++;
                }
            }
        }
        self::assertSame(4, $five, 'team 5 plays all 4 existing teams');

        // Total remaining = full round-robin (5 teams: C(5,2)=10) minus the
        // 4 already consolidated in rounds 1 & 2 = 6 matches.
        $total = $plan->createdMatchCount;
        self::assertSame(6, $total, 'remaining = 10 - 4 consolidated');
    }

    public function testFutureRoundsAreRenumberedContiguouslyFromK(): void
    {
        $existing = $this->buildPlayedRounds(2);

        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        $numbers = array_map(fn (RoundPlan $r) => $r->number, $plan->futureRounds);
        // Must start at 3 and be contiguous.
        $expected = range(3, 3 + count($numbers) - 1);
        self::assertSame($expected, $numbers, 'future rounds contiguous starting at K=3');
    }

    public function testNoTeamPlaysTwicePerFutureRound(): void
    {
        $existing = $this->buildPlayedRounds(2);
        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        foreach ($plan->futureRounds as $round) {
            $seen = [];
            foreach ($round->matches() as $m) {
                self::assertArrayNotHasKey($m->homeTeamId, $seen, 'home team not twice');
                self::assertArrayNotHasKey($m->awayTeamId, $seen, 'away team not twice');
                $seen[$m->homeTeamId] = true;
                $seen[$m->awayTeamId] = true;
            }
        }
    }

    public function testIdempotencyOverUnplayedPortion(): void
    {
        $existing = $this->buildPlayedRounds(2);

        // First regeneration with team 5.
        $first = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        // Second run: team 5 is now part of the roster (already present), same
        // played history. Should yield the same future plan.
        $second = $this->regenerator->regenerate($existing, [1, 2, 3, 4, 5], 5, 3, 1);

        self::assertEquals(
            array_map(fn (RoundPlan $r) => $r->toArray(), $first->futureRounds),
            array_map(fn (RoundPlan $r) => $r->toArray(), $second->futureRounds),
            'regeneration is idempotent over the unplayed portion'
        );
        self::assertSame($first->createdMatchCount, $second->createdMatchCount);
    }

    public function testRemovedRoundIdsAreFutureRoundsOnly(): void
    {
        $existing = $this->buildPlayedRounds(2);
        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        // Future rounds in the 4-team plan were rounds 3 with ids 100+index.
        // Rounds 1,2 (ids 100,101) are preserved; round 3 (id 102) is removed.
        self::assertContains(102, $plan->removedRoundIds);
        self::assertNotContains(100, $plan->removedRoundIds);
        self::assertNotContains(101, $plan->removedRoundIds);
    }

    public function testConsolidatedRoundAtOrAfterKIsStillPreserved(): void
    {
        // Edge: round 3 is finished even though K=3 — it must be preserved
        // (never alter consolidated results), not rebuilt.
        $existing = $this->buildPlayedRounds(3);

        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        self::assertContains(3, $plan->preservedRoundNumbers, 'finished round 3 preserved');
        // Its id (102) must NOT be in removed list.
        self::assertNotContains(102, $plan->removedRoundIds);
    }

    public function testSpecExampleTournamentAtRoundThree(): void
    {
        // Plan §5 example: tournament running, played through round 2, a late
        // team enters → future recalculated and missing matches added.
        $existing = $this->buildPlayedRounds(2);

        $plan = $this->regenerator->regenerate($existing, [1, 2, 3, 4], 5, 3, 1);

        // Preserved played history, future recalculated with team 5, contiguous.
        self::assertSame([1, 2], $plan->preservedRoundNumbers);
        self::assertGreaterThan(0, $plan->affectedRoundCount());
        self::assertSame(6, $plan->createdMatchCount);

        // Every remaining pair of the 5-team round-robin not yet played appears
        // exactly once across future rounds.
        $keys = $this->pairKeys($plan->futureRounds);
        self::assertSame(count($keys), count(array_unique($keys)), 'no duplicate future pairings');
    }
}
