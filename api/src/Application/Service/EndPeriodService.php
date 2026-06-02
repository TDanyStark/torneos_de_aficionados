<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Fixture\Match_;
use App\Domain\Fixture\MatchEventRepository;
use App\Domain\Fixture\MatchPeriod;
use App\Domain\Fixture\MatchPeriodRepository;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\ValidationException;
use PDO;

/**
 * Ends the active (running) period of a match (referee action). Transactional:
 * the period update, its 'period_end' marker event and the match status ->
 * 'paused' transition commit together.
 */
final class EndPeriodService
{
    public function __construct(
        private PDO $pdo,
        private MatchRepository $matches,
        private MatchPeriodRepository $periods,
        private MatchEventRepository $events
    ) {
    }

    public function execute(Match_ $match, int $userId): MatchPeriod
    {
        $active = $this->periods->findActiveByMatch($match->id);
        if ($active === null) {
            throw new ValidationException([
                'period' => 'No hay un período en curso para cerrar.',
            ]);
        }

        return $this->endPeriod($match, $active, $userId);
    }

    /**
     * Ends a known running period inside a transaction. Exposed so FinishMatch
     * can auto-close a still-running period without re-resolving it.
     */
    public function endPeriod(Match_ $match, MatchPeriod $active, int $userId): MatchPeriod
    {
        $this->pdo->beginTransaction();

        try {
            $now = date('Y-m-d H:i:s');

            $updated = $this->periods->update($active->id, [
                'status'   => 'finished',
                'ended_at' => $now,
            ]);

            $this->events->create([
                'match_id'           => $match->id,
                'match_period_id'    => $active->id,
                'type'               => 'period_end',
                'team_id'            => null,
                'player_id'          => null,
                'minute'             => null,
                'created_by_user_id' => $userId,
            ]);

            $this->matches->update($match->id, ['status' => 'paused']);

            $this->pdo->commit();

            return $updated;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
