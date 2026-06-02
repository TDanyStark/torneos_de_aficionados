<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * Snapshot of an already-persisted round + its matches, fed to
 * FixtureRegenerator. Pure DTO. `id` is the DB id; `number` its calendar order.
 */
final class ExistingRound
{
    public const LOCKED_STATUSES = ['in_progress', 'finished'];

    /**
     * @param array<int,ExistingMatch> $matches
     */
    public function __construct(
        public readonly ?int $id,
        public readonly int $number,
        public readonly array $matches,
        public readonly string $status = 'pending',
        public readonly ?int $groupId = null,
    ) {
    }

    /**
     * A round is "consolidated" (must be preserved as-is) if its status is
     * locked OR it contains at least one locked match.
     */
    public function isConsolidated(): bool
    {
        if (in_array($this->status, self::LOCKED_STATUSES, true)) {
            return true;
        }

        foreach ($this->matches as $match) {
            if ($match->isLocked()) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int,ExistingMatch> matches that are locked/consolidated
     */
    public function lockedMatches(): array
    {
        return array_values(array_filter(
            $this->matches,
            static fn (ExistingMatch $m): bool => $m->isLocked()
        ));
    }
}
