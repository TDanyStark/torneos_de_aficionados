<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * The full output of FixtureGenerator. For league/groups it carries an ordered
 * list of RoundPlan (rounds + their pairings/matches). For knockout it carries
 * BracketSlotPlan entries instead. Pure DTO consumed by Part B persistence.
 */
final class FixturePlan
{
    /**
     * @param array<int,RoundPlan>       $rounds
     * @param array<int,BracketSlotPlan> $bracketSlots
     */
    public function __construct(
        public readonly string $type,
        public readonly array $rounds = [],
        public readonly array $bracketSlots = [],
    ) {
    }

    public function totalMatches(): int
    {
        $count = 0;
        foreach ($this->rounds as $round) {
            $count += count($round->matches());
        }

        return $count;
    }

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'type'          => $this->type,
            'rounds'        => array_map(static fn (RoundPlan $r): array => $r->toArray(), $this->rounds),
            'bracket_slots' => array_map(static fn (BracketSlotPlan $s): array => $s->toArray(), $this->bracketSlots),
        ];
    }
}
