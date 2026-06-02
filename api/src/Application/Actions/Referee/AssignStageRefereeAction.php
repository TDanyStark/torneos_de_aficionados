<?php

declare(strict_types=1);

namespace App\Application\Actions\Referee;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Fixture\RoundRepository;
use App\Domain\Referee\RefereeRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/stages/{id}/assign-referee  (organizer)
 *
 * Bulk-assigns (or clears) the match-sheet referee across a stage. {id} is the
 * stage id -> the owning tournament is resolved from the stage and authorized
 * inline. The referee (when not null) must belong to the stage's tournament.
 *
 * Scope:
 *   - default            ALL matches of the stage (every round).
 *   - round_id provided  ONLY that round's matches (must belong to the stage).
 *
 * All updates run inside a single PDO transaction.
 *
 * Body: { "referee_id": int|null, "round_id"?: int|null }
 */
final class AssignStageRefereeAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private StageRepository $stages,
        private TournamentRepository $tournaments,
        private RefereeRepository $referees,
        private RoundRepository $rounds,
        private MatchRepository $matches,
        private TournamentAuthorizer $authorizer,
        private PDO $pdo
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $stageId = (int) $this->arg('id', '0');

        $stage = $this->stages->findById($stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $tournament = $this->tournaments->findById($stage->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $this->authorizer->assert($user, $tournament->id, ['organizer']);

        $body = $this->body();

        if (!array_key_exists('referee_id', $body)) {
            throw new ValidationException([
                'referee_id' => 'El campo referee_id es obligatorio (entero o null).',
            ]);
        }

        // referee_id (nullable). When set, must belong to this tournament.
        $raw = $body['referee_id'];
        $refereeId = null;
        if ($raw !== null && $raw !== '') {
            $refereeId = (int) $raw;
            if ($refereeId <= 0) {
                throw new ValidationException(['referee_id' => 'El árbitro indicado no es válido.']);
            }
            $referee = $this->referees->findById($refereeId);
            if ($referee === null || $referee->tournamentId !== $tournament->id) {
                throw new ValidationException([
                    'referee_id' => 'El árbitro no pertenece al torneo de esta fase.',
                ]);
            }
        }

        // Optional round scope. When set, the round must belong to this stage.
        $roundScope = null;
        if (array_key_exists('round_id', $body) && $body['round_id'] !== null && $body['round_id'] !== '') {
            $roundId = (int) $body['round_id'];
            if ($roundId <= 0) {
                throw new ValidationException(['round_id' => 'La jornada indicada no es válida.']);
            }
            $round = $this->rounds->findById($roundId);
            if ($round === null || $round->stageId !== $stageId) {
                throw new ValidationException([
                    'round_id' => 'La jornada no pertenece a esta fase.',
                ]);
            }
            $roundScope = $roundId;
        }

        // Collect the target matches (round-scoped or stage-wide).
        $matches = [];
        if ($roundScope !== null) {
            $matches = $this->matches->findByRound($roundScope);
        } else {
            foreach ($this->rounds->findByStage($stageId) as $round) {
                foreach ($this->matches->findByRound($round->id) as $match) {
                    $matches[] = $match;
                }
            }
        }

        $updated = 0;
        $this->pdo->beginTransaction();
        try {
            foreach ($matches as $match) {
                $this->matches->update($match->id, ['referee_id' => $refereeId]);
                $updated++;
            }
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return $this->responder->success($this->response, [
            'stage_id'        => $stageId,
            'referee_id'      => $refereeId,
            'round_id'        => $roundScope,
            'matches_updated' => $updated,
        ]);
    }
}
