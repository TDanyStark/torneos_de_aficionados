<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Fixture\Match_;
use App\Domain\Fixture\MatchEventRepository;
use App\Domain\Fixture\MatchPeriod;
use App\Domain\Fixture\MatchPeriodRepository;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Tournament\TournamentRepository;
use PDO;

/**
 * Starts the NEXT period of a match (referee action). Transactional: the period
 * row, its 'period_start' marker event and the match status transition all
 * commit together. Mirrors the RegisterTeamService transaction-coordinator
 * pattern (inject PDO + repos, beginTransaction/commit/rollBack).
 */
final class StartPeriodService
{
    public function __construct(
        private PDO $pdo,
        private MatchRepository $matches,
        private MatchPeriodRepository $periods,
        private MatchEventRepository $events,
        private TournamentRepository $tournaments
    ) {
    }

    public function execute(Match_ $match, int $userId): MatchPeriod
    {
        // Only schedulable/paused matches can start a (new) period.
        if (!in_array($match->status, ['scheduled', 'paused'], true)) {
            throw new ValidationException([
                'status' => 'El partido no admite iniciar un período en su estado actual.',
            ]);
        }

        // There must be no period already running.
        if ($this->periods->findActiveByMatch($match->id) !== null) {
            throw new ValidationException([
                'period' => 'Ya hay un período en curso para este partido.',
            ]);
        }

        // Next period number = max existing + 1.
        $existing = $this->periods->findByMatch($match->id);
        $maxNumber = 0;
        foreach ($existing as $period) {
            if ($period->number > $maxNumber) {
                $maxNumber = $period->number;
            }
        }
        $nextNumber = $maxNumber + 1;

        // Reject if it would exceed the tournament's configured periods.
        $tournament = $this->tournaments->findById($match->tournamentId);
        $periodsCount = $tournament !== null ? $tournament->periodsCount : $nextNumber;
        if ($nextNumber > $periodsCount) {
            throw new ValidationException([
                'period' => 'Todos los períodos del partido ya fueron completados.',
            ]);
        }

        $this->pdo->beginTransaction();

        try {
            $now = date('Y-m-d H:i:s');

            $period = $this->periods->create([
                'match_id'   => $match->id,
                'number'     => $nextNumber,
                'status'     => 'running',
                'started_at' => $now,
            ]);

            // Period-start marker event (for the timeline).
            $this->events->create([
                'match_id'           => $match->id,
                'match_period_id'    => $period->id,
                'type'               => 'period_start',
                'team_id'            => null,
                'player_id'          => null,
                'minute'             => 0,
                'created_by_user_id' => $userId,
            ]);

            // Match goes live. Set started_at on the very first period if unset.
            $matchData = ['status' => 'live'];
            if ($nextNumber === 1 && $match->startedAt === null) {
                $matchData['started_at'] = $now;
            }
            $this->matches->update($match->id, $matchData);

            $this->pdo->commit();

            return $period;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
