<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * A planned bracket slot before persistence. `ref` is a local, stable key used
 * to express next_slot linkage without DB ids; Part B maps refs -> real ids
 * after insert. home_source/away_source encode origin strings such as
 * 'group:{id}#N' or 'winner:slot:{ref}'. Pure DTO.
 */
final class BracketSlotPlan
{
    public function __construct(
        public readonly string $ref,
        public readonly int $roundNumber,
        public readonly int $position,
        public readonly ?string $roundLabel = null,
        public readonly ?string $homeSource = null,
        public readonly ?string $awaySource = null,
        public readonly ?string $nextSlotRef = null,
    ) {
    }

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'ref'           => $this->ref,
            'round_number'  => $this->roundNumber,
            'round_label'   => $this->roundLabel,
            'position'      => $this->position,
            'home_source'   => $this->homeSource,
            'away_source'   => $this->awaySource,
            'next_slot_ref' => $this->nextSlotRef,
        ];
    }
}
