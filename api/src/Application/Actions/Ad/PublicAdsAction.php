<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Ad\AdCreative;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Ad\AdSlot;
use App\Domain\Ad\AdSlotRepository;
use App\Domain\Ad\CreativeResolver;
use DateTimeImmutable;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/ads  (public, no auth)
 *
 * Returns the served creative for every ACTIVE global slot (tournament_id NULL),
 * keyed by placement. Each entry carries the slot and the creative the resolver
 * picked — a sold creative when one is active within its window, otherwise the
 * is_default=1 "espacio disponible" banner.
 *
 * Response data shape (object keyed by placement):
 *   {
 *     "header": { "placement": "header", "slot": {AdSlot}, "creative": {AdCreative} },
 *     "footer": { ... },
 *     ...
 *   }
 * Placements with no active slot / no serveable creative are simply absent.
 */
class PublicAdsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        protected AdSlotRepository $slots,
        protected AdCreativeRepository $creatives,
        protected CreativeResolver $resolver
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $now = new DateTimeImmutable();

        $globalSlots = $this->slots->findGlobals();
        $bundles = $this->buildBundles($globalSlots);

        $resolved = $this->resolver->resolveGlobals($bundles, $now);

        return $this->responder->success(
            $this->response,
            $this->formatResolved($resolved)
        );
    }

    /**
     * Builds resolver "slot bundles" from slot entities: each bundle is
     * ['slot' => AdSlot, 'creatives' => AdCreative[]]. Creatives are bulk-loaded
     * for all slot ids in one query, then grouped by ad_slot_id.
     *
     * @param array<int,AdSlot> $slots
     * @return array<int,array{slot:AdSlot,creatives:array<int,AdCreative>}>
     */
    protected function buildBundles(array $slots): array
    {
        if ($slots === []) {
            return [];
        }

        $ids = array_map(static fn (AdSlot $s): int => $s->id, $slots);

        /** @var array<int,array<int,AdCreative>> $bySlot */
        $bySlot = [];
        foreach ($this->creatives->findActiveBySlotIds($ids) as $creative) {
            $bySlot[$creative->adSlotId][] = $creative;
        }

        $bundles = [];
        foreach ($slots as $slot) {
            $bundles[] = [
                'slot'      => $slot,
                'creatives' => $bySlot[$slot->id] ?? [],
            ];
        }

        return $bundles;
    }

    /**
     * Flattens the resolver's placement map into the public response shape.
     *
     * @param array<string,array{slot:AdSlot,creative:AdCreative}> $resolved
     * @return array<string,array{placement:string,slot:AdSlot,creative:AdCreative}>
     */
    protected function formatResolved(array $resolved): array
    {
        $out = [];
        foreach ($resolved as $placement => $entry) {
            $out[$placement] = [
                'placement' => $placement,
                'slot'      => $entry['slot'],
                'creative'  => $entry['creative'],
            ];
        }

        return $out;
    }
}
