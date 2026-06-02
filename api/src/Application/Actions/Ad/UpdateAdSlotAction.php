<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Ad\AdSlotRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/ad-slots/{id}  (admin)
 *
 * Partial update of a slot. Returns the updated slot with its creatives inline.
 *
 * Body (all optional): name, is_active, placement.
 */
final class UpdateAdSlotAction extends ApiAction
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
        $id = (int) $this->arg('id', '0');

        if ($this->slots->findById($id) === null) {
            throw new NotFoundException('Slot no encontrado.');
        }

        $body = $this->body();
        $data = [];
        $errors = [];

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if ($name === '') {
                $errors['name'] = 'El nombre del slot es obligatorio.';
            } else {
                $data['name'] = $name;
            }
        }

        if (array_key_exists('placement', $body)) {
            $placement = trim((string) $body['placement']);
            if (!in_array($placement, CreateAdSlotAction::PLACEMENTS, true)) {
                $errors['placement'] = 'La posición del slot no es válida.';
            } else {
                $data['placement'] = $placement;
            }
        }

        if (array_key_exists('is_active', $body)) {
            $data['is_active'] = !empty($body['is_active']);
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $slot = $this->slots->update($id, $data);

        $payload = array_merge(
            $slot->jsonSerialize(),
            ['creatives' => $this->creatives->findBySlot($slot->id)]
        );

        return $this->responder->success($this->response, $payload);
    }
}
