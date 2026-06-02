<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Fixture\Match_;
use App\Domain\Fixture\MatchEventRepository;
use App\Domain\Fixture\MatchPeriodRepository;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Sport\SportModuleRegistry;
use App\Domain\Sport\SportRepository;
use App\Domain\Tournament\TournamentRepository;
use PDO;

/**
 * Finishes a match: auto-closes any still-running period, derives the live score
 * from the event stream via the sport module, consolidates the final result
 * (home/away/winner) and persists it on the match with status 'finished'.
 * Single transaction (auto-end period + consolidation commit together).
 *
 * NOTE on draws: SportModule::consolidateResult returns winner_team_id = null on
 * a level score even for sports that disallow draws. For the MVP that is
 * acceptable — knockout penalty/tie-break resolution is a future phase — so a
 * level finished score simply leaves winner_team_id null and DOES NOT block
 * finishing.
 */
final class FinishMatchService
{
    public function __construct(
        private PDO $pdo,
        private MatchRepository $matches,
        private MatchPeriodRepository $periods,
        private MatchEventRepository $events,
        private TournamentRepository $tournaments,
        private SportRepository $sports,
        private SportModuleRegistry $registry
    ) {
    }

    public function execute(Match_ $match, int $userId): Match_
    {
        if ($match->status === 'finished') {
            throw new ValidationException([
                'status' => 'El partido ya está finalizado.',
            ]);
        }

        // Resolve the sport module for this tournament.
        $tournament = $this->tournaments->findById($match->tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }
        $sport = $this->sports->findById($tournament->sportId);
        if ($sport === null) {
            throw new NotFoundException('Deporte no encontrado.');
        }
        $module = $this->registry->get($sport->moduleKey);

        $active = $this->periods->findActiveByMatch($match->id);

        $this->pdo->beginTransaction();

        try {
            $now = date('Y-m-d H:i:s');

            // Auto-close a still-running period for robustness.
            if ($active !== null) {
                $this->periods->update($active->id, [
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
            }

            // Derive live score from events, then consolidate the final result.
            // Use the enriched array rows (keys team_id/type) so the sport
            // module's calculator reads team_id correctly — the MatchEvent entity
            // exposes camelCase (teamId), which the array-keyed calculator path
            // would not see.
            $events = $this->events->findByMatchWithNames($match->id);
            $live = $module->liveScore($events, $match->homeTeamId, $match->awayTeamId);
            $result = $module->consolidateResult(
                $live['home'],
                $live['away'],
                $match->homeTeamId,
                $match->awayTeamId
            );

            $updated = $this->matches->update($match->id, [
                'home_score'     => $result['home_score'],
                'away_score'     => $result['away_score'],
                'winner_team_id' => $result['winner_team_id'],
                'status'         => 'finished',
                'finished_at'    => $now,
            ]);

            $this->pdo->commit();

            return $updated;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
