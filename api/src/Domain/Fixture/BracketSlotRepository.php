<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

/**
 * Contract for bracket_slots persistence. Implemented in Infrastructure (Part B).
 */
interface BracketSlotRepository
{
    public function findById(int $id): ?BracketSlot;

    /**
     * Slots of a stage ordered by round_number ASC, position ASC.
     *
     * @return array<int,BracketSlot>
     */
    public function findByStage(int $stageId): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): BracketSlot;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): BracketSlot;

    public function delete(int $id): void;
}
