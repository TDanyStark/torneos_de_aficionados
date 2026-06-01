<?php

declare(strict_types=1);

namespace App\Application\Actions\Sport;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Sport\SportRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/sports  (public)
 * Lists the active sports catalog (small, fixed set — no pagination needed).
 */
final class ListSportsAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private SportRepository $sports
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $sports = $this->sports->findAllActive();

        return $this->responder->success($this->response, $sports);
    }
}
