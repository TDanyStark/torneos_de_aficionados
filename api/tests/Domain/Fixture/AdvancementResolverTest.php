<?php

declare(strict_types=1);

namespace Tests\Domain\Fixture;

use App\Domain\Fixture\AdvancementResolver;
use App\Domain\Standings\StandingRow;
use PHPUnit\Framework\TestCase;

final class AdvancementResolverTest extends TestCase
{
    private AdvancementResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new AdvancementResolver();
    }

    /**
     * @return array<int,StandingRow> ordered standings of $count teams,
     *                                team ids 1..count, positions assigned.
     */
    private function standings(int $count): array
    {
        $rows = [];
        for ($i = 1; $i <= $count; $i++) {
            // Higher team id earlier => decreasing points; assign positions.
            $rows[] = (new StandingRow($i, 0, 0, 0, 0, 0, 0, $count - $i))->withPosition($i);
        }

        return $rows;
    }

    public function testGroupOfTenEliminatesFour(): void
    {
        // Group of 10: 6 qualify, 4 eliminated.
        $standings = $this->standings(10);

        $plan = $this->resolver->resolve(20, 5, 30, $standings, 6, 4);

        self::assertCount(6, $plan->qualifierTeamIds, '6 qualifiers');
        self::assertCount(4, $plan->eliminatedTeamIds, '4 eliminated');

        // Qualifiers are the top 6 (team ids 1..6 by our ordering).
        self::assertSame([1, 2, 3, 4, 5, 6], $plan->qualifierTeamIds);
        // Eliminated are the bottom 4 (team ids 7..10).
        self::assertSame([7, 8, 9, 10], $plan->eliminatedTeamIds);
    }

    public function testGroupOfElevenEliminatesFive(): void
    {
        // Group of 11: 6 qualify, 5 eliminated.
        $standings = $this->standings(11);

        $plan = $this->resolver->resolve(20, 6, 30, $standings, 6, 5);

        self::assertCount(6, $plan->qualifierTeamIds);
        self::assertCount(5, $plan->eliminatedTeamIds);
        self::assertSame([1, 2, 3, 4, 5, 6], $plan->qualifierTeamIds);
        self::assertSame([7, 8, 9, 10, 11], $plan->eliminatedTeamIds);
    }

    public function testQualifierSourcesUseGroupRankStrings(): void
    {
        $standings = $this->standings(4);

        $plan = $this->resolver->resolve(20, 9, 30, $standings, 2, 0);

        self::assertSame(['group:9#1', 'group:9#2'], $plan->qualifierSources);
    }

    public function testSourcesUseStagePrefixWhenNoGroup(): void
    {
        $standings = $this->standings(4);

        $plan = $this->resolver->resolve(20, null, 30, $standings, 2, 0);

        self::assertSame(['stage:20#1', 'stage:20#2'], $plan->qualifierSources);
    }

    public function testCountsAreClampedToAvailableTeams(): void
    {
        $standings = $this->standings(3);

        // Ask for more qualifiers than teams.
        $plan = $this->resolver->resolve(20, 1, 30, $standings, 10, 0);

        self::assertCount(3, $plan->qualifierTeamIds, 'clamped to available teams');
    }

    public function testQualifiersAndEliminatedDoNotOverlap(): void
    {
        $standings = $this->standings(6);

        // 4 qualify, 4 eliminated would overlap (4+4 > 6). Eliminated must not
        // double-count the qualifiers.
        $plan = $this->resolver->resolve(20, 1, 30, $standings, 4, 4);

        $overlap = array_intersect($plan->qualifierTeamIds, $plan->eliminatedTeamIds);
        self::assertSame([], $overlap, 'no team is both qualifier and eliminated');
    }

    public function testTargetStageIsCarried(): void
    {
        $standings = $this->standings(4);
        $plan = $this->resolver->resolve(20, 1, 99, $standings, 2, 2);

        self::assertSame(99, $plan->targetStageId);
        self::assertSame(20, $plan->sourceStageId);
        self::assertSame(1, $plan->sourceGroupId);
    }
}
