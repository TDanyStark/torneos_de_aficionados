<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * A single scheduled pairing inside a round. A bye is represented by leaving one
 * side null (the team that rests). Pure DTO — no DB.
 */
final class Pairing
{
    public function __construct(
        public readonly ?int $homeTeamId,
        public readonly ?int $awayTeamId,
        public readonly int $leg = 1,
    ) {
    }

    public function isBye(): bool
    {
        return $this->homeTeamId === null || $this->awayTeamId === null;
    }

    /**
     * The team that rests on a bye (or null if this is a real match).
     */
    public function byeTeamId(): ?int
    {
        if (!$this->isBye()) {
            return null;
        }

        return $this->homeTeamId ?? $this->awayTeamId;
    }

    /**
     * @return array<string,int|null>
     */
    public function toArray(): array
    {
        return [
            'home_team_id' => $this->homeTeamId,
            'away_team_id' => $this->awayTeamId,
            'leg'          => $this->leg,
        ];
    }
}
