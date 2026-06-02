<?php

declare(strict_types=1);

namespace App\Domain\Ad;

/**
 * Contract for ad_slots persistence. Implemented in Infrastructure.
 */
interface AdSlotRepository
{
    public function findById(int $id): ?AdSlot;

    /**
     * All global slots (tournament_id IS NULL), ordered.
     *
     * @return array<int,AdSlot>
     */
    public function findGlobals(): array;

    /**
     * All slots for a tournament, ordered.
     *
     * @return array<int,AdSlot>
     */
    public function findByTournament(int $tournamentId): array;

    /**
     * Admin paginated list: every slot (global + per-tournament), ordered.
     *
     * @return array<int,AdSlot>
     */
    public function findAll(int $limit, int $offset): array;

    public function countAll(): int;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): AdSlot;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): AdSlot;

    public function delete(int $id): void;
}
