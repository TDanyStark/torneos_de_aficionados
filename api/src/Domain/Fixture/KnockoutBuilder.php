<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use App\Domain\Fixture\Dto\BracketSlotPlan;
use App\Domain\Shared\Exception\ValidationException;

/**
 * Builds the structure of a single-elimination bracket as a list of
 * BracketSlotPlan. PURE — returns a plan keyed by local refs; Part B maps refs
 * to DB ids and persists next_slot linkage.
 *
 * Slots are emitted round by round (round 1 = first round with the most slots,
 * down to the final). Each slot's winner advances to a parent slot via
 * next_slot_ref; the parent's home_source/away_source is 'winner:slot:{childRef}'.
 */
final class KnockoutBuilder
{
    /**
     * @param array<int,string> $entrants origin source strings feeding round 1,
     *                                     in bracket order (e.g. 'group:5#1').
     *                                     Length must be a power of two >= 2.
     *
     * @return array<int,BracketSlotPlan>
     */
    public function build(array $entrants): array
    {
        $entrants = array_values($entrants);
        $count = count($entrants);

        if ($count < 2) {
            throw new ValidationException([
                'entrants' => 'Se requieren al menos 2 participantes para un bracket.',
            ]);
        }

        if (($count & ($count - 1)) !== 0) {
            throw new ValidationException([
                'entrants' => 'El número de participantes debe ser una potencia de dos.',
            ]);
        }

        $totalRounds = (int) log($count, 2);
        $slots = [];

        // Build round structure bottom-up so we know each round's slot count.
        // Round r (1-based) has $count / 2^r slots.
        /** @var array<int,array<int,string>> $refsByRound  round => [position => ref] */
        $refsByRound = [];
        for ($round = 1; $round <= $totalRounds; $round++) {
            $slotsInRound = intdiv($count, 2 ** $round);
            for ($pos = 1; $pos <= $slotsInRound; $pos++) {
                $refsByRound[$round][$pos] = sprintf('r%d-s%d', $round, $pos);
            }
        }

        for ($round = 1; $round <= $totalRounds; $round++) {
            $label = $this->roundLabel($round, $totalRounds);
            $slotsInRound = count($refsByRound[$round]);

            for ($pos = 1; $pos <= $slotsInRound; $pos++) {
                $ref = $refsByRound[$round][$pos];

                if ($round === 1) {
                    // Sources come from the entrants list (2 per slot).
                    $homeSource = $entrants[($pos - 1) * 2] ?? null;
                    $awaySource = $entrants[($pos - 1) * 2 + 1] ?? null;
                } else {
                    // Sources are the winners of the two feeding child slots.
                    $childA = $refsByRound[$round - 1][($pos - 1) * 2 + 1] ?? null;
                    $childB = $refsByRound[$round - 1][($pos - 1) * 2 + 2] ?? null;
                    $homeSource = $childA !== null ? 'winner:slot:' . $childA : null;
                    $awaySource = $childB !== null ? 'winner:slot:' . $childB : null;
                }

                // next_slot: the parent slot in the following round.
                $nextSlotRef = null;
                if ($round < $totalRounds) {
                    $parentPos = (int) ceil($pos / 2);
                    $nextSlotRef = $refsByRound[$round + 1][$parentPos] ?? null;
                }

                $slots[] = new BracketSlotPlan(
                    $ref,
                    $round,
                    $pos,
                    $label,
                    $homeSource,
                    $awaySource,
                    $nextSlotRef,
                );
            }
        }

        return $slots;
    }

    private function roundLabel(int $round, int $totalRounds): string
    {
        // Distance from the final determines the label.
        $fromFinal = $totalRounds - $round; // 0 = final
        switch ($fromFinal) {
            case 0:
                return 'Final';
            case 1:
                return 'Semifinal';
            case 2:
                return 'Cuartos de final';
            case 3:
                return 'Octavos de final';
            case 4:
                return 'Dieciseisavos de final';
            default:
                $teams = 2 ** ($fromFinal + 1);
                return sprintf('Ronda de %d', $teams);
        }
    }
}
