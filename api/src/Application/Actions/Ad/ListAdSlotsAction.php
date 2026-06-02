<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Ad\AdSlot;
use App\Domain\Ad\AdSlotRepository;
use App\Domain\Shared\Pagination;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/ad-slots  (admin)
 *
 * Paginated list of EVERY slot (global + per-tournament), newest first. Each
 * item embeds its full creatives list (default + sold, all states) so the admin
 * panel renders without a second round-trip per slot.
 *
 * Item shape: { ...AdSlot fields, "creatives": [ {AdCreative}, ... ] }
 * Envelope:   { success, data: [items], meta: { pagination } }
 */
final class ListAdSlotsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private AdSlotRepository $slots,
        private AdCreativeRepository $creatives
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $pagination = Pagination::fromQuery($this->query());

        $slots = $this->slots->findAll($pagination->limit(), $pagination->offset());
        $total = $this->slots->countAll();

        $items = array_map(
            fn (AdSlot $slot): array => array_merge(
                $slot->jsonSerialize(),
                ['creatives' => $this->creatives->findBySlot($slot->id)]
            ),
            $slots
        );

        return $this->responder->paginated(
            $this->response,
            $items,
            $pagination->meta($total)
        );
    }
}
