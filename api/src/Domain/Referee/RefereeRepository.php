<?php

declare(strict_types=1);

namespace App\Domain\Referee;

/**
 * Contract for referee persistence. Implemented in Infrastructure.
 */
interface RefereeRepository
{
    public function findById(int $id): ?Referee;

    /**
     * Referees of a tournament ordered by name ASC.
     *
     * @return array<int,Referee>
     */
    public function findByTournament(int $tournamentId): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(int $tournamentId, array $data): Referee;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Referee;

    public function delete(int $id): void;
}
