<?php

declare(strict_types=1);

namespace App\Domain\Ad;

use DateTimeImmutable;

/**
 * Pure domain resolver (no DB) that decides which creative a slot serves at a
 * given moment, and builds the placement->{slot,creative} map for the public
 * /ads and /tournaments/{id}/ads endpoints. Mirrors AdvancementResolver /
 * StandingsCalculator: deterministic, side-effect free, fully unit-testable.
 *
 * --- INPUT SHAPES (Part B's Action builds these from repo data) ---
 *
 * A "slot bundle" is an associative array:
 *     [
 *         'slot'      => AdSlot,            // the slot entity
 *         'creatives' => AdCreative[],      // ALL creatives of that slot
 *                                           //   (active + default + expired;
 *                                           //    the resolver filters them)
 *     ]
 *
 * resolveForSlot() takes just the creatives array.
 * resolveGlobals() / resolveTournament() take lists of slot bundles.
 *
 * --- OUTPUT SHAPE ---
 *
 * The placement maps are keyed by placement string. Each present entry is:
 *     [
 *         'slot'     => AdSlot,
 *         'creative' => AdCreative,   // the served creative (sellable or default)
 *     ]
 * A placement is OMITTED from the map when no slot exists for it OR the slot has
 * no serveable creative at all (no sellable-in-window and no default).
 */
final class CreativeResolver
{
    /**
     * Resolve the served creative for ONE slot from its creatives.
     *
     * Rule: among is_active=1, is_default=0 creatives whose window contains $now
     * (starts_at NULL or <= now) AND (ends_at NULL or >= now), pick the most
     * recent (highest id) -> serve it. If none qualify, fall back to the
     * is_default=1 creative (most recent if several). If neither exists -> null.
     *
     * @param array<int,AdCreative> $creatives
     */
    public function resolveForSlot(array $creatives, DateTimeImmutable $now): ?AdCreative
    {
        $sellable = [];
        $default  = null;

        foreach ($creatives as $creative) {
            if (!$creative->isActive) {
                continue;
            }

            if ($creative->isDefault) {
                if ($default === null || $creative->id > $default->id) {
                    $default = $creative;
                }
                continue;
            }

            if ($this->isWithinWindow($creative, $now)) {
                $sellable[] = $creative;
            }
        }

        if ($sellable !== []) {
            usort(
                $sellable,
                static fn (AdCreative $a, AdCreative $b): int => $b->id <=> $a->id
            );

            return $sellable[0];
        }

        return $default;
    }

    /**
     * Build the placement->{slot,creative} map for the public global endpoint.
     *
     * @param array<int,array{slot:AdSlot,creatives:array<int,AdCreative>}> $globalSlotBundles
     * @return array<string,array{slot:AdSlot,creative:AdCreative}>
     */
    public function resolveGlobals(array $globalSlotBundles, DateTimeImmutable $now): array
    {
        return $this->resolveBundlesByPlacement($globalSlotBundles, $now);
    }

    /**
     * Build the placement->{slot,creative} map for a tournament, with GLOBAL
     * fallback: for each placement, the tournament slot wins; if the tournament
     * has no (serveable) slot for that placement, fall back to the global slot.
     *
     * @param array<int,array{slot:AdSlot,creatives:array<int,AdCreative>}> $tournamentSlotBundles
     * @param array<int,array{slot:AdSlot,creatives:array<int,AdCreative>}> $globalSlotBundles
     * @return array<string,array{slot:AdSlot,creative:AdCreative}>
     */
    public function resolveTournament(
        array $tournamentSlotBundles,
        array $globalSlotBundles,
        DateTimeImmutable $now
    ): array {
        $globals     = $this->resolveBundlesByPlacement($globalSlotBundles, $now);
        $tournaments = $this->resolveBundlesByPlacement($tournamentSlotBundles, $now);

        // Tournament entries override globals per placement.
        return array_merge($globals, $tournaments);
    }

    /**
     * @param array<int,array{slot:AdSlot,creatives:array<int,AdCreative>}> $bundles
     * @return array<string,array{slot:AdSlot,creative:AdCreative}>
     */
    private function resolveBundlesByPlacement(array $bundles, DateTimeImmutable $now): array
    {
        $map = [];

        foreach ($bundles as $bundle) {
            $slot = $bundle['slot'];

            if (!$slot->isActive) {
                continue;
            }

            $creative = $this->resolveForSlot($bundle['creatives'], $now);
            if ($creative === null) {
                continue;
            }

            // First active slot wins a placement (input is pre-ordered by repo).
            if (!isset($map[$slot->placement])) {
                $map[$slot->placement] = [
                    'slot'     => $slot,
                    'creative' => $creative,
                ];
            }
        }

        return $map;
    }

    private function isWithinWindow(AdCreative $creative, DateTimeImmutable $now): bool
    {
        if ($creative->startsAt !== null) {
            $starts = new DateTimeImmutable($creative->startsAt);
            if ($starts > $now) {
                return false;
            }
        }

        if ($creative->endsAt !== null) {
            $ends = new DateTimeImmutable($creative->endsAt);
            if ($ends < $now) {
                return false;
            }
        }

        return true;
    }
}
