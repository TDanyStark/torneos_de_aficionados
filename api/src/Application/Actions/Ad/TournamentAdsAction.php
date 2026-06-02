<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Domain\Ad\AdSlot;
use DateTimeImmutable;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{id}/ads  (public, no auth)
 *
 * Returns the served creative per placement for a tournament, with GLOBAL
 * fallback: the tournament's own slot wins a placement; where the tournament has
 * no serveable slot, the matching global slot applies. We do NOT 404 a valid
 * tournament that simply has no slots — globals still apply. {id} is the
 * tournament id; non-numeric / unknown ids just yield the global map.
 *
 * Response data shape is IDENTICAL to GET /ads (placement-keyed object), so the
 * frontend reuses a single renderer:
 *   { "header": { "placement": "header", "slot": {AdSlot}, "creative": {AdCreative} }, ... }
 */
final class TournamentAdsAction extends PublicAdsAction
{
    protected function handle(): Response
    {
        $tournamentId = (int) $this->arg('id', '0');

        $now = new DateTimeImmutable();

        /** @var array<int,AdSlot> $globalSlots */
        $globalSlots = $this->slots->findGlobals();
        /** @var array<int,AdSlot> $tournamentSlots */
        $tournamentSlots = $tournamentId > 0
            ? $this->slots->findByTournament($tournamentId)
            : [];

        $globalBundles = $this->buildBundles($globalSlots);
        $tournamentBundles = $this->buildBundles($tournamentSlots);

        $resolved = $this->resolver->resolveTournament(
            $tournamentBundles,
            $globalBundles,
            $now
        );

        return $this->responder->success(
            $this->response,
            $this->formatResolved($resolved)
        );
    }
}
