<?php

declare(strict_types=1);

namespace App\Domain\Live;

/**
 * Consolidates a final match result from home/away scores. PURE — derives the
 * winner_team_id (null on draw). When draws are NOT allowed and the scores are
 * level, the winner is left null too: tie-breaking (penalties, etc.) is a
 * higher-level concern the caller resolves explicitly. Reused by the sport
 * module so the core never branches on sport.
 */
final class MatchResultConsolidator
{
    /**
     * @return array{home_score:int,away_score:int,winner_team_id:?int}
     */
    public function consolidate(
        int $homeScore,
        int $awayScore,
        ?int $homeTeamId,
        ?int $awayTeamId,
        bool $drawsAllowed
    ): array {
        $winnerTeamId = null;

        if ($homeScore > $awayScore) {
            $winnerTeamId = $homeTeamId;
        } elseif ($awayScore > $homeScore) {
            $winnerTeamId = $awayTeamId;
        }
        // Equal scores -> winner null (draw, or unresolved when draws not allowed).
        // $drawsAllowed is accepted so callers can branch on whether an extra
        // tie-break step is required; it does not change the derived winner here.
        unset($drawsAllowed);

        return [
            'home_score'     => $homeScore,
            'away_score'     => $awayScore,
            'winner_team_id' => $winnerTeamId,
        ];
    }
}
