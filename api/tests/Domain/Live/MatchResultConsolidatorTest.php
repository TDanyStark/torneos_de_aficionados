<?php

declare(strict_types=1);

namespace Tests\Domain\Live;

use App\Domain\Live\MatchResultConsolidator;
use PHPUnit\Framework\TestCase;

final class MatchResultConsolidatorTest extends TestCase
{
    private MatchResultConsolidator $consolidator;

    private const HOME = 10;
    private const AWAY = 20;

    protected function setUp(): void
    {
        $this->consolidator = new MatchResultConsolidator();
    }

    public function testHomeWinSetsHomeAsWinner(): void
    {
        $result = $this->consolidator->consolidate(3, 1, self::HOME, self::AWAY, true);

        $this->assertSame([
            'home_score'     => 3,
            'away_score'     => 1,
            'winner_team_id' => self::HOME,
        ], $result);
    }

    public function testAwayWinSetsAwayAsWinner(): void
    {
        $result = $this->consolidator->consolidate(0, 2, self::HOME, self::AWAY, true);

        $this->assertSame([
            'home_score'     => 0,
            'away_score'     => 2,
            'winner_team_id' => self::AWAY,
        ], $result);
    }

    public function testDrawYieldsNullWinnerWhenDrawsAllowed(): void
    {
        $result = $this->consolidator->consolidate(2, 2, self::HOME, self::AWAY, true);

        $this->assertSame([
            'home_score'     => 2,
            'away_score'     => 2,
            'winner_team_id' => null,
        ], $result);
    }

    public function testLevelScoreYieldsNullWinnerWhenDrawsNotAllowed(): void
    {
        // Draws not allowed: winner is still null here — a tie-break step is the
        // caller's responsibility, not this pure consolidator's.
        $result = $this->consolidator->consolidate(1, 1, self::HOME, self::AWAY, false);

        $this->assertSame([
            'home_score'     => 1,
            'away_score'     => 1,
            'winner_team_id' => null,
        ], $result);
    }

    public function testZeroZeroIsADraw(): void
    {
        $result = $this->consolidator->consolidate(0, 0, self::HOME, self::AWAY, true);

        $this->assertNull($result['winner_team_id']);
    }

    public function testNullSideIdWinnerIsNullEvenWhenThatSideWins(): void
    {
        $result = $this->consolidator->consolidate(2, 0, null, self::AWAY, true);

        // Home wins but its id is unknown -> winner_team_id null.
        $this->assertNull($result['winner_team_id']);
    }
}
