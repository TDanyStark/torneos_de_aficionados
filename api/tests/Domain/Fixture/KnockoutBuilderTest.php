<?php

declare(strict_types=1);

namespace Tests\Domain\Fixture;

use App\Domain\Fixture\Dto\BracketSlotPlan;
use App\Domain\Fixture\KnockoutBuilder;
use App\Domain\Shared\Exception\ValidationException;
use PHPUnit\Framework\TestCase;

final class KnockoutBuilderTest extends TestCase
{
    private KnockoutBuilder $builder;

    protected function setUp(): void
    {
        $this->builder = new KnockoutBuilder();
    }

    public function testEightEntrantsProduceSevenSlots(): void
    {
        // 8 -> 4 -> 2 -> 1 = 7 slots.
        $entrants = ['group:1#1', 'group:2#2', 'group:1#2', 'group:2#1', 'group:3#1', 'group:4#2', 'group:3#2', 'group:4#1'];
        $slots = $this->builder->build($entrants);

        self::assertCount(7, $slots);

        // Round 1 has 4 slots, round 2 has 2, round 3 (final) has 1.
        $byRound = [];
        foreach ($slots as $slot) {
            $byRound[$slot->roundNumber] = ($byRound[$slot->roundNumber] ?? 0) + 1;
        }
        self::assertSame([1 => 4, 2 => 2, 3 => 1], $byRound);
    }

    public function testRoundOneSourcesComeFromEntrants(): void
    {
        $entrants = ['group:1#1', 'group:2#2', 'group:1#2', 'group:2#1'];
        $slots = $this->builder->build($entrants);

        $round1 = array_values(array_filter($slots, fn (BracketSlotPlan $s) => $s->roundNumber === 1));
        self::assertCount(2, $round1);

        self::assertSame('group:1#1', $round1[0]->homeSource);
        self::assertSame('group:2#2', $round1[0]->awaySource);
        self::assertSame('group:1#2', $round1[1]->homeSource);
        self::assertSame('group:2#1', $round1[1]->awaySource);
    }

    public function testFinalSourcesAreWinnersOfSemifinals(): void
    {
        $entrants = ['group:1#1', 'group:2#2', 'group:1#2', 'group:2#1'];
        $slots = $this->builder->build($entrants);

        $final = null;
        foreach ($slots as $slot) {
            if ($slot->roundLabel === 'Final') {
                $final = $slot;
            }
        }

        self::assertNotNull($final);
        self::assertStringStartsWith('winner:slot:', (string) $final->homeSource);
        self::assertStringStartsWith('winner:slot:', (string) $final->awaySource);
        self::assertNull($final->nextSlotRef, 'final has no next slot');
    }

    public function testNextSlotLinkageChainsWinners(): void
    {
        $entrants = ['group:1#1', 'group:2#2', 'group:1#2', 'group:2#1'];
        $slots = $this->builder->build($entrants);

        // Both round-1 slots point to the same final slot ref.
        $round1 = array_values(array_filter($slots, fn (BracketSlotPlan $s) => $s->roundNumber === 1));
        self::assertNotNull($round1[0]->nextSlotRef);
        self::assertSame($round1[0]->nextSlotRef, $round1[1]->nextSlotRef);
    }

    public function testRoundLabels(): void
    {
        $entrants = range(1, 8);
        $entrants = array_map(fn ($i) => "group:1#{$i}", $entrants);
        $slots = $this->builder->build($entrants);

        $labels = [];
        foreach ($slots as $slot) {
            $labels[$slot->roundNumber] = $slot->roundLabel;
        }

        self::assertSame('Cuartos de final', $labels[1]);
        self::assertSame('Semifinal', $labels[2]);
        self::assertSame('Final', $labels[3]);
    }

    public function testNonPowerOfTwoThrows(): void
    {
        $this->expectException(ValidationException::class);
        $this->builder->build(['a', 'b', 'c']);
    }

    public function testFewerThanTwoThrows(): void
    {
        $this->expectException(ValidationException::class);
        $this->builder->build(['only-one']);
    }
}
