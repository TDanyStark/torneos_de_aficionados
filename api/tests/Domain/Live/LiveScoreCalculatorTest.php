<?php

declare(strict_types=1);

namespace Tests\Domain\Live;

use App\Domain\Live\LiveScoreCalculator;
use PHPUnit\Framework\TestCase;

final class LiveScoreCalculatorTest extends TestCase
{
    private LiveScoreCalculator $calculator;

    private const HOME = 10;
    private const AWAY = 20;

    protected function setUp(): void
    {
        $this->calculator = new LiveScoreCalculator();
    }

    /**
     * @param array<string,mixed> $overrides
     *
     * @return array<string,mixed>
     */
    private function event(string $type, ?int $teamId, array $overrides = []): array
    {
        return array_merge([
            'type'    => $type,
            'team_id' => $teamId,
        ], $overrides);
    }

    public function testEmptyEventsYieldZeroZero(): void
    {
        $score = $this->calculator->calculate([], self::HOME, self::AWAY);

        $this->assertSame(['home' => 0, 'away' => 0], $score);
    }

    public function testGoalsAreCreditedToTheScoringSide(): void
    {
        $events = [
            $this->event('goal', self::HOME),
            $this->event('goal', self::HOME),
            $this->event('goal', self::AWAY),
        ];

        $score = $this->calculator->calculate($events, self::HOME, self::AWAY);

        $this->assertSame(['home' => 2, 'away' => 1], $score);
    }

    public function testOwnGoalCreditsTheOpponent(): void
    {
        // Home team scores an own goal -> away benefits, and vice versa.
        $events = [
            $this->event('own_goal', self::HOME),
            $this->event('own_goal', self::AWAY),
            $this->event('own_goal', self::AWAY),
        ];

        $score = $this->calculator->calculate($events, self::HOME, self::AWAY);

        $this->assertSame(['home' => 2, 'away' => 1], $score);
    }

    public function testGoalsAndOwnGoalsCombine(): void
    {
        $events = [
            $this->event('goal', self::HOME),      // home 1
            $this->event('own_goal', self::AWAY),  // home 2
            $this->event('goal', self::AWAY),      // away 1
            $this->event('own_goal', self::HOME),  // away 2
        ];

        $score = $this->calculator->calculate($events, self::HOME, self::AWAY);

        $this->assertSame(['home' => 2, 'away' => 2], $score);
    }

    public function testCardsAndPeriodMarkersAreIgnored(): void
    {
        $events = [
            $this->event('goal', self::HOME),
            $this->event('yellow_card', self::HOME),
            $this->event('red_card', self::AWAY),
            $this->event('period_start', self::HOME),
            $this->event('period_end', self::AWAY),
        ];

        $score = $this->calculator->calculate($events, self::HOME, self::AWAY);

        $this->assertSame(['home' => 1, 'away' => 0], $score);
    }

    public function testNullTeamEventsAreIgnored(): void
    {
        $events = [
            $this->event('goal', null),
            $this->event('goal', self::HOME),
            $this->event('own_goal', null),
        ];

        $score = $this->calculator->calculate($events, self::HOME, self::AWAY);

        $this->assertSame(['home' => 1, 'away' => 0], $score);
    }

    public function testGoalForUnknownTeamIsIgnored(): void
    {
        $events = [
            $this->event('goal', 999), // belongs to neither side
            $this->event('goal', self::AWAY),
        ];

        $score = $this->calculator->calculate($events, self::HOME, self::AWAY);

        $this->assertSame(['home' => 0, 'away' => 1], $score);
    }

    public function testNullSideIdsAreHandledGracefully(): void
    {
        $events = [
            $this->event('goal', self::HOME),
            $this->event('goal', self::AWAY),
        ];

        $score = $this->calculator->calculate($events, null, null);

        $this->assertSame(['home' => 0, 'away' => 0], $score);
    }

    public function testAcceptsObjectEvents(): void
    {
        $events = [
            (object) ['type' => 'goal', 'team_id' => self::HOME],
            (object) ['type' => 'own_goal', 'team_id' => self::HOME],
        ];

        $score = $this->calculator->calculate($events, self::HOME, self::AWAY);

        $this->assertSame(['home' => 1, 'away' => 1], $score);
    }
}
