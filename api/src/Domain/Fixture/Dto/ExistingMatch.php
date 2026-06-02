<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * Snapshot of an already-persisted match, fed to FixtureRegenerator. Pure DTO.
 * `id` is the DB id (so Part B knows which matches to keep). `status` decides
 * whether the match is consolidated (played/in-progress) and must be preserved.
 */
final class ExistingMatch
{
    /** Statuses that mean the match is consolidated and MUST NOT be altered. */
    public const LOCKED_STATUSES = ['live', 'paused', 'finished', 'walkover'];

    public function __construct(
        public readonly ?int $id,
        public readonly ?int $homeTeamId,
        public readonly ?int $awayTeamId,
        public readonly string $status = 'scheduled',
        public readonly int $leg = 1,
    ) {
    }

    public function isLocked(): bool
    {
        return in_array($this->status, self::LOCKED_STATUSES, true);
    }

    public function isBye(): bool
    {
        return $this->homeTeamId === null || $this->awayTeamId === null;
    }

    /**
     * Unordered set key for "these two teams played each other" regardless of
     * home/away. Returns null for byes.
     */
    public function pairKey(): ?string
    {
        if ($this->isBye()) {
            return null;
        }

        $a = (int) $this->homeTeamId;
        $b = (int) $this->awayTeamId;
        [$lo, $hi] = $a <= $b ? [$a, $b] : [$b, $a];

        return $lo . '-' . $hi . ':leg' . $this->leg;
    }
}
