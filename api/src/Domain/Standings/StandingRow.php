<?php

declare(strict_types=1);

namespace App\Domain\Standings;

use JsonSerializable;

/**
 * A single ordered row of a standings table. Pure DTO — no DB.
 *
 * Metrics use the classic football abbreviations but are sport-neutral enough to
 * reuse: PJ (played), PG (won), PE (drawn), PP (lost), GF (goals for),
 * GC (goals against), DG (goal difference), Pts (points).
 *
 * `position` is assigned by the strategy after ordering (1-based). It is null
 * until the strategy ranks the rows.
 */
final class StandingRow implements JsonSerializable
{
    public function __construct(
        public readonly int $teamId,
        public readonly int $played = 0,
        public readonly int $won = 0,
        public readonly int $drawn = 0,
        public readonly int $lost = 0,
        public readonly int $goalsFor = 0,
        public readonly int $goalsAgainst = 0,
        public readonly int $points = 0,
        public readonly ?int $position = null,
        public readonly ?string $teamName = null,
    ) {
    }

    public function goalDifference(): int
    {
        return $this->goalsFor - $this->goalsAgainst;
    }

    /**
     * Returns a copy with a freshly assigned 1-based position.
     */
    public function withPosition(int $position): self
    {
        return new self(
            $this->teamId,
            $this->played,
            $this->won,
            $this->drawn,
            $this->lost,
            $this->goalsFor,
            $this->goalsAgainst,
            $this->points,
            $position,
            $this->teamName,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'team_id'         => $this->teamId,
            'team_name'       => $this->teamName,
            'position'        => $this->position,
            'played'          => $this->played,
            'won'             => $this->won,
            'drawn'           => $this->drawn,
            'lost'            => $this->lost,
            'goals_for'       => $this->goalsFor,
            'goals_against'   => $this->goalsAgainst,
            'goal_difference' => $this->goalDifference(),
            'points'          => $this->points,
        ];
    }
}
