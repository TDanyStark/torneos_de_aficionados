<?php

declare(strict_types=1);

namespace Tests\Domain\Fixture;

use App\Domain\Fixture\StandingsCalculator;
use App\Domain\Standings\StandingsConfig;
use App\Infrastructure\Sport\Football\FootballStandingsStrategy;
use PHPUnit\Framework\TestCase;

final class StandingsCalculatorTest extends TestCase
{
    private StandingsCalculator $calculator;

    protected function setUp(): void
    {
        $this->calculator = new StandingsCalculator(new FootballStandingsStrategy());
    }

    /**
     * @param array<string,mixed> $overrides
     *
     * @return array<string,mixed>
     */
    private function match(int $home, int $away, int $hs, int $as, array $overrides = []): array
    {
        return array_merge([
            'home_team_id'   => $home,
            'away_team_id'   => $away,
            'home_score'     => $hs,
            'away_score'     => $as,
            'winner_team_id' => null,
            'status'         => 'finished',
        ], $overrides);
    }

    public function testPointsAndMetricsAccumulate(): void
    {
        $config = new StandingsConfig(3, 1, 0);
        $matches = [
            $this->match(1, 2, 2, 0), // 1 beats 2
            $this->match(1, 3, 1, 1), // 1 draws 3
            $this->match(2, 3, 0, 3), // 3 beats 2
        ];

        $rows = $this->calculator->calculate([1, 2, 3], $matches, $config);

        // Index by team for assertions.
        $byTeam = [];
        foreach ($rows as $r) {
            $byTeam[$r->teamId] = $r;
        }

        // Team 1: W + D = 4 pts, GF=3, GC=1, DG=2.
        self::assertSame(4, $byTeam[1]->points);
        self::assertSame(3, $byTeam[1]->goalsFor);
        self::assertSame(1, $byTeam[1]->goalsAgainst);
        self::assertSame(2, $byTeam[1]->goalDifference());
        self::assertSame(2, $byTeam[1]->played);
        self::assertSame(1, $byTeam[1]->won);
        self::assertSame(1, $byTeam[1]->drawn);

        // Team 3: W + D = 4 pts, GF=4, GC=1, DG=3.
        self::assertSame(4, $byTeam[3]->points);
        self::assertSame(3, $byTeam[3]->goalDifference());

        // Team 2: 2 losses = 0 pts.
        self::assertSame(0, $byTeam[2]->points);
        self::assertSame(2, $byTeam[2]->lost);
    }

    public function testOrderingByPointsThenGoalDifference(): void
    {
        $config = new StandingsConfig(3, 1, 0, ['points', 'goal_difference', 'goals_for']);
        $matches = [
            $this->match(1, 2, 5, 0), // 1: 3pts DG+5
            $this->match(3, 4, 1, 0), // 3: 3pts DG+1
            $this->match(2, 4, 0, 0), // draw
            $this->match(1, 3, 0, 0), // draw
        ];

        $rows = $this->calculator->calculate([1, 2, 3, 4], $matches, $config);

        // Team 1: 3+1 = 4 pts, DG=+5. Team 3: 3+1 = 4 pts, DG=+1.
        // Team 1 ranks above team 3 by goal difference.
        self::assertSame(1, $rows[0]->position);
        self::assertSame(1, $rows[0]->teamId);
        self::assertSame(3, $rows[1]->teamId);
    }

    public function testHeadToHeadTiebreakerMiniTable(): void
    {
        // Teams 1 and 2 end level on points and goal difference; head-to-head
        // decides. Use a tiebreaker order where head_to_head is reached.
        $config = new StandingsConfig(3, 1, 0, ['points', 'head_to_head', 'goal_difference']);

        $matches = [
            // Head-to-head: team 2 beat team 1.
            $this->match(1, 2, 0, 1),
            // Both beat a common weaker side by the same margin to stay level.
            $this->match(1, 3, 3, 0),
            $this->match(2, 3, 3, 0),
        ];

        // Team 1: loss + win = 3 pts, GF=3 GC=1 DG=+2.
        // Team 2: win  + win = 6 pts... not level. Adjust so points are equal:
        // Give team 1 an extra win to equalize points.
        $matches[] = $this->match(1, 4, 3, 0); // team 1 now 6 pts
        $matches[] = $this->match(2, 4, 3, 0); // keep symmetry, team 2 still 9? recalc

        // Recompute intent: we want equal points + equal DG, h2h decides.
        // Simpler deterministic scenario below overrides the above.
        $config = new StandingsConfig(3, 1, 0, ['points', 'head_to_head']);
        $matches = [
            $this->match(1, 2, 1, 2), // 2 beats 1 (head to head)
            $this->match(1, 3, 2, 0), // 1 beats 3
            $this->match(2, 3, 2, 0), // 2 beats 3
        ];
        // Team 1: L + W = 3 pts. Team 2: W + W = 6 pts. Not equal.
        // Force equality: drop team 2's second win to a loss vs team 3.
        $matches = [
            $this->match(2, 1, 1, 0), // 2 beats 1  (h2h: 2 over 1)
            $this->match(1, 3, 3, 0), // 1 beats 3
            $this->match(3, 2, 3, 0), // 3 beats 2
        ];
        // Team 1: L(0) + W(3) = 3 pts, GF=3 GC=1.
        // Team 2: W(3) + L(0) = 3 pts, GF=1 GC=3.
        // Team 3: L + W = 3 pts, GF=3 GC=3.
        // Points all equal at 3. Among 1 vs 2 head-to-head: team 2 beat team 1,
        // so team 2 ranks above team 1.
        $rows = $this->calculator->calculate([1, 2, 3], $matches, $config);

        $positions = [];
        foreach ($rows as $r) {
            $positions[$r->teamId] = $r->position;
        }

        self::assertLessThan(
            $positions[1],
            $positions[2],
            'team 2 (won head-to-head vs 1) ranks above team 1'
        );
    }

    public function testOnlyFinishedMatchesCount(): void
    {
        $config = new StandingsConfig(3, 1, 0);
        $matches = [
            $this->match(1, 2, 3, 0, ['status' => 'scheduled']), // ignored
            $this->match(1, 2, 1, 0, ['status' => 'finished']),  // counts
        ];

        $rows = $this->calculator->calculate([1, 2], $matches, $config);
        $byTeam = [];
        foreach ($rows as $r) {
            $byTeam[$r->teamId] = $r;
        }

        self::assertSame(1, $byTeam[1]->played, 'only the finished match counts');
        self::assertSame(3, $byTeam[1]->points);
    }

    public function testTeamWithNoMatchesStillAppears(): void
    {
        $config = new StandingsConfig(3, 1, 0);
        $matches = [$this->match(1, 2, 1, 0)];

        $rows = $this->calculator->calculate([1, 2, 3], $matches, $config);

        self::assertCount(3, $rows, 'team 3 (no matches) still has a row');
        $teamIds = array_map(fn ($r) => $r->teamId, $rows);
        self::assertContains(3, $teamIds);
    }
}
