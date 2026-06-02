<?php

declare(strict_types=1);

namespace App\Domain\Live;

/**
 * Derives the live score of a match from its event stream and consolidates a
 * final result. PURE — no DB, no I/O — so it is fully unit-testable and reused
 * by the sport module (FootballModule) without leaking sport logic into core.
 *
 * Scoring rules:
 *  - type 'goal'      -> +1 to the scoring event's team_id side.
 *  - type 'own_goal'  -> +1 to the OPPONENT side (an own goal benefits the rival).
 *  - any other type   -> ignored (cards, period markers).
 *
 * Events with a null/unknown team_id (or that don't match either side) are
 * ignored defensively rather than throwing, so a partially-recorded stream
 * still yields a usable score.
 */
final class LiveScoreCalculator
{
    /**
     * @param array<int,array<string,mixed>|object> $events each event exposes a
     *        'type' and a 'team_id' (array key or object property).
     *
     * @return array{home:int,away:int}
     */
    public function calculate(array $events, ?int $homeTeamId, ?int $awayTeamId): array
    {
        $home = 0;
        $away = 0;

        foreach ($events as $event) {
            $type = $this->field($event, 'type');
            $teamId = $this->intField($event, 'team_id');

            if ($teamId === null) {
                continue;
            }

            if ($type === 'goal') {
                if ($teamId === $homeTeamId) {
                    $home++;
                } elseif ($teamId === $awayTeamId) {
                    $away++;
                }
            } elseif ($type === 'own_goal') {
                // Own goal: the OTHER team gets the point.
                if ($teamId === $homeTeamId) {
                    $away++;
                } elseif ($teamId === $awayTeamId) {
                    $home++;
                }
            }
            // All other types (cards, period_start/end) do not affect the score.
        }

        return ['home' => $home, 'away' => $away];
    }

    /**
     * Reads a string field from an event array or object.
     *
     * @param array<string,mixed>|object $event
     */
    private function field(array|object $event, string $key): ?string
    {
        if (is_array($event)) {
            return isset($event[$key]) && $event[$key] !== null ? (string) $event[$key] : null;
        }

        return isset($event->{$key}) && $event->{$key} !== null ? (string) $event->{$key} : null;
    }

    /**
     * Reads an int field from an event array or object.
     *
     * @param array<string,mixed>|object $event
     */
    private function intField(array|object $event, string $key): ?int
    {
        if (is_array($event)) {
            return isset($event[$key]) && $event[$key] !== null ? (int) $event[$key] : null;
        }

        return isset($event->{$key}) && $event->{$key} !== null ? (int) $event->{$key} : null;
    }
}
