<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use JsonSerializable;

/**
 * A match (partido). Score source for standings is home_score/away_score/
 * winner_team_id (consolidated by the sport module on finish, Fase 5).
 *
 * NOTE: class is named Match_ because `Match` is a reserved keyword in PHP 8.
 * The DB table is `matches`.
 */
final class Match_ implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $tournamentId,
        public readonly int $stageId,
        public readonly ?int $groupId,
        public readonly ?int $roundId,
        public readonly ?int $homeTeamId,
        public readonly ?int $awayTeamId,
        public readonly ?int $homeScore,
        public readonly ?int $awayScore,
        public readonly ?int $winnerTeamId,
        public readonly string $status,
        public readonly ?string $venue,
        public readonly ?string $scheduledAt,
        public readonly ?string $startedAt,
        public readonly ?string $finishedAt,
        public readonly ?int $refereeUserId,
        public readonly ?int $refereeId,
        public readonly int $leg,
        public readonly ?int $bracketSlotId,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        $int = static fn (string $k): ?int =>
            isset($row[$k]) && $row[$k] !== null ? (int) $row[$k] : null;
        $str = static fn (string $k): ?string =>
            isset($row[$k]) && $row[$k] !== null ? (string) $row[$k] : null;

        return new self(
            (int) $row['id'],
            (int) $row['tournament_id'],
            (int) $row['stage_id'],
            $int('group_id'),
            $int('round_id'),
            $int('home_team_id'),
            $int('away_team_id'),
            $int('home_score'),
            $int('away_score'),
            $int('winner_team_id'),
            (string) $row['status'],
            $str('venue'),
            $str('scheduled_at'),
            $str('started_at'),
            $str('finished_at'),
            $int('referee_user_id'),
            $int('referee_id'),
            isset($row['leg']) ? (int) $row['leg'] : 1,
            $int('bracket_slot_id'),
            $str('created_at'),
            $str('updated_at'),
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'              => $this->id,
            'tournament_id'   => $this->tournamentId,
            'stage_id'        => $this->stageId,
            'group_id'        => $this->groupId,
            'round_id'        => $this->roundId,
            'home_team_id'    => $this->homeTeamId,
            'away_team_id'    => $this->awayTeamId,
            'home_score'      => $this->homeScore,
            'away_score'      => $this->awayScore,
            'winner_team_id'  => $this->winnerTeamId,
            'status'          => $this->status,
            'venue'           => $this->venue,
            'scheduled_at'    => $this->scheduledAt,
            'started_at'      => $this->startedAt,
            'finished_at'     => $this->finishedAt,
            'referee_user_id' => $this->refereeUserId,
            'referee_id'      => $this->refereeId,
            'leg'             => $this->leg,
            'bracket_slot_id' => $this->bracketSlotId,
            'created_at'      => $this->createdAt,
            'updated_at'      => $this->updatedAt,
        ];
    }
}
