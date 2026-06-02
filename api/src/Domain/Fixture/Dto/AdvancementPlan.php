<?php

declare(strict_types=1);

namespace App\Domain\Fixture\Dto;

/**
 * The outcome of resolving advancement for a single source group: who qualifies
 * (ordered top-N), who is eliminated (bottom-N), and the resolved bracket source
 * strings for qualifiers (e.g. 'group:{id}#1'). Pure DTO.
 */
final class AdvancementPlan
{
    /**
     * @param array<int,int>    $qualifierTeamIds ordered (1st place first)
     * @param array<int,int>    $eliminatedTeamIds
     * @param array<int,string> $qualifierSources position-indexed source strings
     */
    public function __construct(
        public readonly int $sourceStageId,
        public readonly ?int $sourceGroupId,
        public readonly ?int $targetStageId,
        public readonly array $qualifierTeamIds,
        public readonly array $eliminatedTeamIds,
        public readonly array $qualifierSources,
    ) {
    }

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'source_stage_id'    => $this->sourceStageId,
            'source_group_id'    => $this->sourceGroupId,
            'target_stage_id'    => $this->targetStageId,
            'qualifier_team_ids' => $this->qualifierTeamIds,
            'eliminated_team_ids' => $this->eliminatedTeamIds,
            'qualifier_sources'  => $this->qualifierSources,
        ];
    }
}
