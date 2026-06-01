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
}
