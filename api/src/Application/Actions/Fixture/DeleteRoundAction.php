<?php

declare(strict_types=1);

namespace App\Application\Actions\Fixture;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\Dto\ExistingMatch;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Fixture\RoundRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\User\User;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * DELETE /api/v1/rounds/{id}  (organizer)
 *
 * Removes a round (jornada) and its UNPLAYED matches. {id} is the round id ->
 * the owning tournament is resolved via round -> stage and authorized inline.
 *
 * POLICY: matches.round_id is ON DELETE SET NULL, so a raw delete would ORPHAN
 * the round's matches instead of removing them. We therefore:
 *   1. Reject (422) if ANY match is locked (live/paused/finished/walkover) to
 *      protect consolidated data.
 *   2. Otherwise delete the round's unplayed matches first, then the round,
 *      inside a single transaction.
 */
final class DeleteRoundAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private RoundRepository $rounds,
        private MatchRepository $matches,
        private StageRepository $stages,
        private TournamentAuthorizer $authorizer,
        private PDO $pdo
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $roundId = (int) $this->arg('id', '0');

        $round = $this->rounds->findById($roundId);
        if ($round === null) {
            throw new NotFoundException('Fecha no encontrada.');
        }

        $stage = $this->stages->findById($round->stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        // Protect played/in-progress data: refuse if any match is locked.
        foreach ($this->matches->findByRound($roundId) as $match) {
            if (in_array($match->status, ExistingMatch::LOCKED_STATUSES, true)) {
                throw new ValidationException([
                    'round' => 'No se puede eliminar una fecha con partidos jugados o en curso.',
                ]);
            }
        }

        $this->pdo->beginTransaction();
        try {
            // Removes only non-consolidated matches (locked ones are skipped, but
            // we already verified there are none).
            $this->matches->deleteUnplayedByRound($roundId);
            $this->rounds->delete($roundId);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return $this->responder->noContent($this->response);
    }
}
