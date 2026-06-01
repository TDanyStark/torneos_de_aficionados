<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/{slug}  (public)
 * Full detail of a single tournament by slug.
 */
final class ShowTournamentAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $slug = (string) $this->arg('slug', '');

        $tournament = $this->tournaments->findBySlug($slug);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        return $this->responder->success($this->response, $tournament);
    }
}
