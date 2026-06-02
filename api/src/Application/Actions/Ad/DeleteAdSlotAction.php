<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Ad\AdSlotRepository;
use App\Domain\Shared\Exception\NotFoundException;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/ad-slots/{id}  (admin)
 *
 * Hard delete. The FK CASCADE on ad_creatives.ad_slot_id removes all creatives
 * (including the default banner) along with the slot. Returns 204.
 */
final class DeleteAdSlotAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private AdSlotRepository $slots
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $id = (int) $this->arg('id', '0');

        if ($this->slots->findById($id) === null) {
            throw new NotFoundException('Slot no encontrado.');
        }

        $this->slots->delete($id);

        return $this->responder->noContent($this->response);
    }
}
