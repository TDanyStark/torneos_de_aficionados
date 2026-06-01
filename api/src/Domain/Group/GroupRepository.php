<?php

declare(strict_types=1);

namespace App\Domain\Group;

/**
 * Contract for group persistence. Implemented in Infrastructure.
 */
interface GroupRepository
{
    public function findById(int $id): ?Group;

    /**
     * @return array<int,Group>
     */
    public function findByStage(int $stageId): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(int $stageId, array $data): Group;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Group;

    public function delete(int $id): void;
}
