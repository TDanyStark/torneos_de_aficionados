<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/ad-creatives/{id}  (admin)
 *
 * Deletes a SOLD creative. The is_default=1 banner is protected: deleting it is
 * rejected (422), because every slot must keep its default banner while it
 * exists (the default goes away only when the slot itself is deleted, via
 * CASCADE). Returns 204 on success.
 */
final class DeleteAdCreativeAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private AdCreativeRepository $creatives
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $id = (int) $this->arg('id', '0');

        $creative = $this->creatives->findById($id);
        if ($creative === null) {
            throw new NotFoundException('Creative no encontrado.');
        }

        if ($creative->isDefault) {
            throw new ValidationException(
                ['is_default' => 'No se puede eliminar el banner por defecto del slot.']
            );
        }

        $this->creatives->delete($id);

        return $this->responder->noContent($this->response);
    }
}
