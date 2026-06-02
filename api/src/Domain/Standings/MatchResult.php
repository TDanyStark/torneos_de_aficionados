<?php

declare(strict_types=1);

namespace App\Domain\Standings;

/**
 * Neutral, immutable representation of a played match's outcome, fed to a
 * StandingsStrategy. Only FINISHED matches with both scores present should be
 * passed in (the caller is responsible for filtering). Pure DTO — no DB.
 */
final class MatchResult
{
    public function __construct(
        public readonly int $homeTeamId,
        public readonly int $awayTeamId,
        public readonly int $homeScore,
        public readonly int $awayScore,
        public readonly ?int $winnerTeamId = null,
    ) {
    }

    /**
     * Builds from a raw matches row. Returns null when the match is not usable
     * for standings (not finished, missing team or missing score).
     *
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): ?self
    {
        $status = isset($row['status']) ? (string) $row['status'] : 'finished';
        if ($status !== 'finished') {
            return null;
        }

        if ($row['home_team_id'] === null || $row['away_team_id'] === null) {
            return null;
        }

        if ($row['home_score'] === null || $row['away_score'] === null) {
            return null;
        }

        return new self(
            (int) $row['home_team_id'],
            (int) $row['away_team_id'],
            (int) $row['home_score'],
            (int) $row['away_score'],
            isset($row['winner_team_id']) && $row['winner_team_id'] !== null
                ? (int) $row['winner_team_id']
                : null,
        );
    }
}
