<?php

declare(strict_types=1);

namespace App\Application\Actions\Live;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Fixture\MatchEventRepository;
use App\Domain\Fixture\MatchPeriodRepository;
use App\Domain\Fixture\MatchRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Sport\SportModuleRegistry;
use App\Domain\Sport\SportRepository;
use App\Domain\Tournament\TournamentRepository;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/matches/{id}/live  (PUBLIC)
 *
 * One lightweight payload for public match-following (polling). The score is
 * DERIVED from the event stream via the sport module while the match is
 * live/paused; once finished, the consolidated stored score is returned. The
 * timeline lists events ordered by id ASC with player/team names resolved.
 */
final class LiveMatchAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private MatchRepository $matches,
        private MatchPeriodRepository $periods,
        private MatchEventRepository $events,
        private TournamentRepository $tournaments,
        private SportRepository $sports,
        private SportModuleRegistry $registry
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $matchId = (int) $this->arg('id', '0');

        $match = $this->matches->findById($matchId);
        if ($match === null) {
            throw new NotFoundException('Partido no encontrado.');
        }

        // Resolve the sport module for live scoring.
        $tournament = $this->tournaments->findById($match->tournamentId);
        $sport = $tournament !== null ? $this->sports->findById($tournament->sportId) : null;
        $module = $sport !== null && $this->registry->has($sport->moduleKey)
            ? $this->registry->get($sport->moduleKey)
            : null;

        $eventRows = $this->events->findByMatchWithNames($match->id);

        // Score: stored when finished, derived from events otherwise.
        if ($match->status === 'finished') {
            $score = [
                'home' => $match->homeScore ?? 0,
                'away' => $match->awayScore ?? 0,
            ];
        } elseif ($module !== null) {
            $score = $module->liveScore($eventRows, $match->homeTeamId, $match->awayTeamId);
        } else {
            $score = ['home' => 0, 'away' => 0];
        }

        // Periods + active period summary.
        $periods = $this->periods->findByMatch($match->id);
        $active = $this->periods->findActiveByMatch($match->id);
        $activePeriod = $active !== null ? [
            'id'         => $active->id,
            'number'     => $active->number,
            'status'     => $active->status,
            'started_at' => $active->startedAt,
        ] : null;

        return $this->responder->success($this->response, [
            'match' => [
                'id'              => $match->id,
                'tournament_id'   => $match->tournamentId,
                'status'          => $match->status,
                'home_team_id'    => $match->homeTeamId,
                'away_team_id'    => $match->awayTeamId,
                'home_score'      => $match->homeScore,
                'away_score'      => $match->awayScore,
                'winner_team_id'  => $match->winnerTeamId,
                'started_at'      => $match->startedAt,
                'finished_at'     => $match->finishedAt,
                'scheduled_at'    => $match->scheduledAt,
                'referee_user_id' => $match->refereeUserId,
            ],
            'score'         => ['home' => $score['home'], 'away' => $score['away']],
            'active_period' => $activePeriod,
            'periods'       => $periods,
            'events'        => $eventRows,
        ]);
    }
}
