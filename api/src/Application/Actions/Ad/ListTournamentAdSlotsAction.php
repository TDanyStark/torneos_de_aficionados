<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Ad\AdSlot;
use App\Domain\Ad\AdSlotRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/admin/tournaments/{id}/ad-slots  (admin)
 *
 * Lists EVERY slot belonging to a single tournament (tournament_id = {id}),
 * each embedding its full creatives list (default + sold, all states) — the
 * SAME item shape as the global GET /ad-slots admin list. A tournament owns few
 * slots, so this is NOT paginated; it returns a plain `data` array.
 *
 * Item shape: { ...AdSlot fields, "creatives": [ {AdCreative}, ... ] }
 * Envelope:   { success, data: [items] }
 *
 * 404 if the tournament does not exist.
 */
final class ListTournamentAdSlotsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private AdSlotRepository $slots,
        private AdCreativeRepository $creatives,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $tournamentId = (int) $this->arg('id', '0');

        if ($tournamentId <= 0 || $this->tournaments->findById($tournamentId) === null) {
            throw new NotFoundException('El torneo no existe.');
        }

        $slots = $this->slots->findByTournament($tournamentId);

        // Same creatives-bundling logic as ListAdSlotsAction: embed each slot's
        // full creatives list (all states) inline.
        $items = array_map(
            fn (AdSlot $slot): array => array_merge(
                $slot->jsonSerialize(),
                ['creatives' => $this->creatives->findBySlot($slot->id)]
            ),
            $slots
        );

        return $this->responder->success($this->response, $items);
    }
}
