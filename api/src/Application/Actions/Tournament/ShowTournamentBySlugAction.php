<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/tournaments/by-slug/{slug}  (auth required, owner OR admin)
 * Full detail of a single tournament by slug for management/edit views. Mirrors
 * the ownership check used by ShowTournamentByIdAction and UpdateTournamentAction
 * so the edit page can be addressed by the canonical slug instead of the numeric
 * id. Distinct `by-slug` prefix avoids the public /{slug} route.
 */
final class ShowTournamentBySlugAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $slug = (string) $this->arg('slug', '');

        $tournament = $this->tournaments->findBySlug($slug);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        if (!$user->isAdmin && $tournament->ownerUserId !== $user->id) {
            throw new ForbiddenException('Solo el organizador propietario puede ver este torneo.');
        }

        return $this->responder->success($this->response, $tournament);
    }
}
