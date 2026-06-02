<?php

declare(strict_types=1);

namespace Tests\Domain\Fixture;

use App\Domain\Fixture\Dto\Pairing;
use App\Domain\Fixture\Dto\RoundPlan;
use App\Domain\Fixture\RoundRobinScheduler;
use PHPUnit\Framework\TestCase;

final class RoundRobinSchedulerTest extends TestCase
{
    private RoundRobinScheduler $scheduler;

    protected function setUp(): void
    {
        $this->scheduler = new RoundRobinScheduler();
    }

    /**
     * Unordered pair key so home/away order does not matter when checking that
     * each pairing happens exactly once.
     */
    private function pairKey(Pairing $p): string
    {
        $a = (int) $p->homeTeamId;
        $b = (int) $p->awayTeamId;
        [$lo, $hi] = $a <= $b ? [$a, $b] : [$b, $a];

        return $lo . '-' . $hi;
    }

    /**
     * @param array<int,RoundPlan> $rounds
     *
     * @return array<int,Pairing>
     */
    private function allMatches(array $rounds): array
    {
        $out = [];
        foreach ($rounds as $round) {
            foreach ($round->matches() as $m) {
                $out[] = $m;
            }
        }

        return $out;
    }

    public function testEvenNFourTeamsHasThreeRounds(): void
    {
        $rounds = $this->scheduler->schedule([1, 2, 3, 4], 1);

        self::assertCount(3, $rounds, '4 teams => 3 rounds');

        // Each round must contain exactly 2 matches and no team twice.
        foreach ($rounds as $round) {
            self::assertCount(2, $round->matches());
            $teamsThisRound = [];
            foreach ($round->matches() as $m) {
                $teamsThisRound[] = $m->homeTeamId;
                $teamsThisRound[] = $m->awayTeamId;
            }
            self::assertCount(4, array_unique($teamsThisRound), 'no team appears twice in a round');
        }
    }

    public function testEvenNEveryPairExactlyOnce(): void
    {
        $rounds = $this->scheduler->schedule([1, 2, 3, 4], 1);
        $matches = $this->allMatches($rounds);

        self::assertCount(6, $matches, '4 teams => C(4,2)=6 matches');

        $keys = array_map(fn (Pairing $p) => $this->pairKey($p), $matches);
        self::assertCount(6, array_unique($keys), 'every pair plays exactly once');

        // All 6 distinct pairs are present.
        $expected = ['1-2', '1-3', '1-4', '2-3', '2-4', '3-4'];
        sort($keys);
        self::assertSame($expected, $keys);
    }

    public function testOddNFiveTeamsFiveRoundsWithByes(): void
    {
        $rounds = $this->scheduler->schedule([1, 2, 3, 4, 5], 1);

        self::assertCount(5, $rounds, '5 teams => 5 rounds');

        // Each round has 2 real matches and exactly one bye.
        $byeCount = [];
        foreach ($rounds as $round) {
            self::assertCount(2, $round->matches(), 'two matches per round');
            $bye = $round->byeTeamId();
            self::assertNotNull($bye, 'each round has a bye');
            $byeCount[$bye] = ($byeCount[$bye] ?? 0) + 1;
        }

        // Each team byes exactly once.
        ksort($byeCount);
        self::assertSame([1 => 1, 2 => 1, 3 => 1, 4 => 1, 5 => 1], $byeCount);
    }

    public function testOddNEveryPairExactlyOnce(): void
    {
        $rounds = $this->scheduler->schedule([1, 2, 3, 4, 5], 1);
        $matches = $this->allMatches($rounds);

        self::assertCount(10, $matches, '5 teams => C(5,2)=10 matches');

        $keys = array_map(fn (Pairing $p) => $this->pairKey($p), $matches);
        self::assertCount(10, array_unique($keys), 'every pair exactly once');
    }

    public function testLegsTwoDoublesRoundsAndInvertsHomeAway(): void
    {
        $single = $this->scheduler->schedule([1, 2, 3, 4], 1);
        $double = $this->scheduler->schedule([1, 2, 3, 4], 2);

        self::assertCount(3, $single);
        self::assertCount(6, $double, 'legs=2 doubles the rounds');

        // Round numbers are contiguous 1..6.
        $numbers = array_map(fn (RoundPlan $r) => $r->number, $double);
        self::assertSame([1, 2, 3, 4, 5, 6], $numbers);

        // Each ordered (home,away) directed pairing of leg 1 appears inverted in leg 2.
        $leg1Directed = [];
        foreach (array_slice($double, 0, 3) as $round) {
            foreach ($round->matches() as $m) {
                $leg1Directed[] = $m->homeTeamId . '>' . $m->awayTeamId;
            }
        }
        $leg2Directed = [];
        foreach (array_slice($double, 3, 3) as $round) {
            foreach ($round->matches() as $m) {
                self::assertSame(2, $m->leg, 'second-leg pairings tagged leg=2');
                $leg2Directed[] = $m->homeTeamId . '>' . $m->awayTeamId;
            }
        }

        sort($leg1Directed);
        // Invert leg2 and compare to leg1 set.
        $leg2Inverted = array_map(static function (string $d): string {
            [$h, $a] = explode('>', $d);
            return $a . '>' . $h;
        }, $leg2Directed);
        sort($leg2Inverted);

        self::assertSame($leg1Directed, $leg2Inverted, 'leg2 is leg1 with home/away swapped');
    }

    public function testLegsTwoEveryOrderedPairPlayedHomeAndAway(): void
    {
        $rounds = $this->scheduler->schedule([1, 2, 3], 2);
        $matches = $this->allMatches($rounds);

        // 3 teams, legs=2 => each ordered pair once => 6 matches.
        self::assertCount(6, $matches);

        $directed = [];
        foreach ($matches as $m) {
            $directed[] = $m->homeTeamId . '>' . $m->awayTeamId;
        }
        sort($directed);
        $expected = ['1>2', '1>3', '2>1', '2>3', '3>1', '3>2'];
        self::assertSame($expected, $directed, 'every ordered pair played exactly once');
    }

    public function testLargeNTenTeamsHasFortyFiveMatches(): void
    {
        $teams = range(1, 10);
        $rounds = $this->scheduler->schedule($teams, 1);

        self::assertCount(9, $rounds, '10 teams => 9 rounds');

        $matches = $this->allMatches($rounds);
        self::assertCount(45, $matches, '10 teams => C(10,2)=45 matches');

        $keys = array_map(fn (Pairing $p) => $this->pairKey($p), $matches);
        self::assertCount(45, array_unique($keys), 'all unique pairs');

        // No team plays twice in any round.
        foreach ($rounds as $round) {
            $seen = [];
            foreach ($round->matches() as $m) {
                self::assertArrayNotHasKey($m->homeTeamId, $seen);
                self::assertArrayNotHasKey($m->awayTeamId, $seen);
                $seen[$m->homeTeamId] = true;
                $seen[$m->awayTeamId] = true;
            }
        }
    }

    public function testFewerThanTwoTeamsYieldsNoRounds(): void
    {
        self::assertSame([], $this->scheduler->schedule([1], 1));
        self::assertSame([], $this->scheduler->schedule([], 1));
    }

    public function testDeterministicOutput(): void
    {
        $a = $this->scheduler->schedule([5, 9, 2, 7], 2);
        $b = $this->scheduler->schedule([5, 9, 2, 7], 2);

        self::assertEquals(
            array_map(fn (RoundPlan $r) => $r->toArray(), $a),
            array_map(fn (RoundPlan $r) => $r->toArray(), $b),
            'same input yields identical output'
        );
    }

    public function testGroupIdAndStartNumberAreStamped(): void
    {
        $rounds = $this->scheduler->schedule([1, 2, 3, 4], 1, 77, 10);

        self::assertSame([10, 11, 12], array_map(fn (RoundPlan $r) => $r->number, $rounds));
        foreach ($rounds as $round) {
            self::assertSame(77, $round->groupId);
        }
    }
}
