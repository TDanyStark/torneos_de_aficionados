<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use App\Domain\Fixture\Dto\FixturePlan;
use App\Domain\Fixture\Dto\GroupInput;
use App\Domain\Shared\Exception\ValidationException;

/**
 * High-level pure coordinator. Given a stage type and its groups (each with its
 * own ordered team ids), picks the right algorithm and returns a FixturePlan.
 *
 *  - 'league' / 'groups' -> RoundRobinScheduler per group (independent
 *     round-robins; asymmetric groups coexist). Round numbers are global and
 *     contiguous across groups so the calendar stays ordered.
 *  - 'knockout'          -> KnockoutBuilder from resolved entrant sources.
 *
 * PURE — no DB. Part B persists the plan inside a transaction.
 */
final class FixtureGenerator
{
    public function __construct(
        private readonly RoundRobinScheduler $scheduler = new RoundRobinScheduler(),
        private readonly KnockoutBuilder $knockoutBuilder = new KnockoutBuilder(),
    ) {
    }

    /**
     * @param array<int,GroupInput> $groups
     */
    public function generateRoundRobin(array $groups, int $legs = 1): FixturePlan
    {
        $rounds = [];
        $number = 1;

        foreach ($groups as $group) {
            $groupRounds = $this->scheduler->schedule(
                $group->teamIds,
                $legs,
                $group->groupId,
                $number
            );

            foreach ($groupRounds as $round) {
                $rounds[] = $round;
            }

            // Continue global numbering after the last round of this group.
            if ($groupRounds !== []) {
                $last = $groupRounds[count($groupRounds) - 1];
                $number = $last->number + 1;
            }
        }

        return new FixturePlan('league', $rounds, []);
    }

    /**
     * @param array<int,string> $entrants ordered bracket entrant source strings
     */
    public function generateKnockout(array $entrants): FixturePlan
    {
        $slots = $this->knockoutBuilder->build($entrants);

        return new FixturePlan('knockout', [], $slots);
    }

    /**
     * Dispatches by stage type.
     *
     * @param array<int,GroupInput> $groups   for league/groups
     * @param array<int,string>     $entrants for knockout
     */
    public function generate(string $stageType, array $groups = [], int $legs = 1, array $entrants = []): FixturePlan
    {
        switch ($stageType) {
            case 'league':
            case 'groups':
                return $this->generateRoundRobin($groups, $legs);
            case 'knockout':
                return $this->generateKnockout($entrants);
            default:
                throw new ValidationException([
                    'stage_type' => sprintf('Tipo de fase no soportado: %s', $stageType),
                ]);
        }
    }
}
