<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * Output of FixtureRegenerator. Pure DTO consumed by Part B:
 *
 *  - preservedRoundNumbers: rounds kept untouched (their matches/results stand).
 *  - removedRoundIds:       DB ids of future, non-consolidated rounds to delete
 *                           and rebuild (Part B deletes their unplayed matches).
 *  - futureRounds:          the freshly recomputed future RoundPlan list.
 *  - affectedRoundCount / createdMatchCount: summary for the API response.
 */
final class RegenerationPlan
{
    /**
     * @param array<int,int>       $preservedRoundNumbers
     * @param array<int,int>       $removedRoundIds
     * @param array<int,RoundPlan> $futureRounds
     */
    public function __construct(
        public readonly array $preservedRoundNumbers,
        public readonly array $removedRoundIds,
        public readonly array $futureRounds,
        public readonly int $createdMatchCount,
    ) {
    }

    public function affectedRoundCount(): int
    {
        return count($this->futureRounds);
    }

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'preserved_round_numbers' => $this->preservedRoundNumbers,
            'removed_round_ids'       => $this->removedRoundIds,
            'affected_round_count'    => $this->affectedRoundCount(),
            'created_match_count'     => $this->createdMatchCount,
            'future_rounds'           => array_map(
                static fn (RoundPlan $r): array => $r->toArray(),
                $this->futureRounds
            ),
        ];
    }
}
