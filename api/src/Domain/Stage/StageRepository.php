<?php

declare(strict_types=1);

namespace App\Domain\Stage;

/**
 * Contract for stage persistence. Implemented in Infrastructure.
 */
interface StageRepository
{
    public function findById(int $id): ?Stage;

    /**
     * @return array<int,Stage>
     */
    public function findByTournament(int $tournamentId): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(int $tournamentId, array $data): Stage;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Stage;

    public function delete(int $id): void;
}
