<?php

declare(strict_types=1);

namespace App\Domain\Sport\Contracts;

/**
 * Contract every sport implements. The core (tournaments, stages, fixtures)
 * stays generic; sport-specific match detail, scoring and stats live behind
 * this interface. See plan/01-arquitectura.md §7.
 *
 * NOTE: This is the Phase 1 skeleton. Method signatures will be fleshed out
 * (with Match entities, payloads and result objects) in Phase 5.
 */
interface SportModule
{
    /**
     * Stable identifier matching sports.module_key (e.g. 'football').
     */
    public function key(): string;

    /**
     * Human-readable label for diagnostics/registry listings.
     */
    public function label(): string;

    /**
     * Event types this sport records in live matches (e.g. goal, yellow_card).
     *
     * @return array<int,string>
     */
    public function eventTypes(): array;

    /**
     * Whether this sport allows draws (affects standings/knockout resolution).
     */
    public function allowsDraws(): bool;

    /**
     * Standings computation strategy for this sport. The core delegates HOW
     * points/metrics are scored and how ties are broken to this strategy while
     * keeping the table structure (rows, order, positions) generic.
     */
    public function standingsStrategy(): StandingsStrategy;

    /**
     * Derives the live score of a match from its event stream. Keeps live-score
     * rules (e.g. own goals crediting the opponent) inside the sport module so
     * the core stays sport-agnostic.
     *
     * @param array<int,array<string,mixed>|object> $events events with 'type'
     *                                                       and 'team_id'
     *
     * @return array{home:int,away:int}
     */
    public function liveScore(array $events, ?int $homeTeamId, ?int $awayTeamId): array;

    /**
     * Consolidates a final result from home/away scores, deriving the winning
     * team id (null on draw). Uses allowsDraws() to decide whether a level score
     * is a legitimate draw.
     *
     * @return array{home_score:int,away_score:int,winner_team_id:?int}
     */
    public function consolidateResult(
        int $home,
        int $away,
        ?int $homeTeamId,
        ?int $awayTeamId
    ): array;
}
