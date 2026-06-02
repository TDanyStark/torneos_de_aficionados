<?php

declare(strict_types=1);

namespace App\Domain\GroupTeam;

/**
 * Contract for group_teams persistence. Implemented in Infrastructure.
 */
interface GroupTeamRepository
{
    public function findById(int $id): ?GroupTeam;

    /**
     * @return array<int,GroupTeam>
     */
    public function findByGroup(int $groupId): array;

    public function exists(int $groupId, int $tournamentTeamId): bool;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): GroupTeam;

    public function delete(int $id): void;
}
