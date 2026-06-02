<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

/**
 * Contract for rounds persistence. Implemented in Infrastructure (Part B).
 */
interface RoundRepository
{
    public function findById(int $id): ?Round;

    /**
     * Rounds of a stage ordered by number ASC.
     *
     * @return array<int,Round>
     */
    public function findByStage(int $stageId): array;

    /**
     * Rounds of a tournament ordered by number ASC.
     *
     * @return array<int,Round>
     */
    public function findByTournament(int $tournamentId): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Round;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Round;

    public function delete(int $id): void;
}
