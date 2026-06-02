<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use App\Domain\Fixture\Dto\AdvancementPlan;
use App\Domain\Standings\StandingRow;

/**
 * Resolves advancement out of a group: given ordered standings + a rule
 * (qualifies_count / eliminates_count), select top-N qualifiers and bottom-N
 * eliminated, and produce bracket source strings for the qualifiers. PURE.
 *
 * Persistence (writing group_teams for a league/groups target, or resolving
 * bracket_slots sources for a knockout target) happens in Part B using this plan.
 */
final class AdvancementResolver
{
    /**
     * @param array<int,StandingRow> $standings ordered (position 1 first)
     */
    public function resolve(
        int $sourceStageId,
        ?int $sourceGroupId,
        ?int $targetStageId,
        array $standings,
        ?int $qualifiesCount,
        ?int $eliminatesCount
    ): AdvancementPlan {
        $ordered = array_values($standings);
        $total = count($ordered);

        $qualifies = $qualifiesCount !== null ? max(0, min($qualifiesCount, $total)) : 0;
        $eliminates = $eliminatesCount !== null ? max(0, min($eliminatesCount, $total)) : 0;

        $qualifierRows = array_slice($ordered, 0, $qualifies);

        // Eliminated = bottom-N (do not double-count with qualifiers).
        $eliminatedRows = $eliminates > 0
            ? array_slice($ordered, max($qualifies, $total - $eliminates))
            : [];

        $qualifierTeamIds = array_map(
            static fn (StandingRow $r): int => $r->teamId,
            $qualifierRows
        );
        $eliminatedTeamIds = array_map(
            static fn (StandingRow $r): int => $r->teamId,
            $eliminatedRows
        );

        // Source strings: 'group:{id}#N' (1-based rank). When there is no group
        // (a single league), fall back to 'stage:{id}#N'.
        $sources = [];
        foreach ($qualifierTeamIds as $index => $teamId) {
            $rank = $index + 1;
            $sources[] = $sourceGroupId !== null
                ? sprintf('group:%d#%d', $sourceGroupId, $rank)
                : sprintf('stage:%d#%d', $sourceStageId, $rank);
        }

        return new AdvancementPlan(
            $sourceStageId,
            $sourceGroupId,
            $targetStageId,
            array_values($qualifierTeamIds),
            array_values($eliminatedTeamIds),
            $sources,
        );
    }
}
