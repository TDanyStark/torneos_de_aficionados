<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use JsonSerializable;

/**
 * A live match event (goal, own goal, card or period marker). Live score and
 * tournament stats are DERIVED from these rows. `playerId` references
 * players.id; `teamId` references tournament_teams.id. DB table is
 * `match_events`.
 */
final class MatchEvent implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $matchId,
        public readonly ?int $matchPeriodId,
        public readonly string $type,
        public readonly ?int $teamId,
        public readonly ?int $playerId,
        public readonly ?int $minute,
        public readonly ?int $createdByUserId,
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
            (int) $row['match_id'],
            $int('match_period_id'),
            (string) $row['type'],
            $int('team_id'),
            $int('player_id'),
            $int('minute'),
            $int('created_by_user_id'),
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
            'id'                 => $this->id,
            'match_id'           => $this->matchId,
            'match_period_id'    => $this->matchPeriodId,
            'type'               => $this->type,
            'team_id'            => $this->teamId,
            'player_id'          => $this->playerId,
            'minute'             => $this->minute,
            'created_by_user_id' => $this->createdByUserId,
            'created_at'         => $this->createdAt,
            'updated_at'         => $this->updatedAt,
        ];
    }
}
