<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * A planned round (jornada): an ordered number plus its list of pairings,
 * optionally scoped to a group. Pure DTO — the persistence layer (Part B) turns
 * this into a rounds row + matches rows.
 */
final class RoundPlan
{
    /**
     * @param array<int,Pairing> $pairings
     */
    public function __construct(
        public readonly int $number,
        public readonly array $pairings,
        public readonly ?int $groupId = null,
        public readonly ?string $name = null,
        public readonly int $leg = 1,
    ) {
    }

    /**
     * @return array<int,Pairing> only the real (non-bye) pairings
     */
    public function matches(): array
    {
        return array_values(array_filter(
            $this->pairings,
            static fn (Pairing $p): bool => !$p->isBye()
        ));
    }

    public function byeTeamId(): ?int
    {
        foreach ($this->pairings as $pairing) {
            if ($pairing->isBye()) {
                return $pairing->byeTeamId();
            }
        }

        return null;
    }

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'number'   => $this->number,
            'group_id' => $this->groupId,
            'name'     => $this->name,
            'leg'      => $this->leg,
            'pairings' => array_map(static fn (Pairing $p): array => $p->toArray(), $this->pairings),
        ];
    }
}
