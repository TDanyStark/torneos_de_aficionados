<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * Input describing one group (or the single league) to schedule: the group id
 * (null for a league with no groups) and its ordered team ids. Pure DTO.
 */
final class GroupInput
{
    /**
     * @param array<int,int> $teamIds ordered by seed (NULLs last) then name
     */
    public function __construct(
        public readonly ?int $groupId,
        public readonly array $teamIds,
    ) {
    }
}
