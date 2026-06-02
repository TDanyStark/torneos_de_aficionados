<?php

declare(strict_types=1);

namespace App\Domain\Player;

/**
 * Contract for players (organizer pool) persistence. Implemented in
 * Infrastructure.
 */
interface PlayerRepository
{
    public function findById(int $id): ?Player;

    /**
     * Finds a player in a given organizer's pool by cédula (the reuse lookup).
     */
    public function findByOrganizerAndDocument(int $organizerUserId, string $documentId): ?Player;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Player;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Player;

    /**
     * Derives the player's history within the owning organizer: tournaments and
     * teams played. Goals/cards come from match_events (Fase 4) and are returned
     * as 0 until that table exists.
     *
     * @return array<int,array<string,mixed>>
     */
    public function historyForOrganizer(int $playerId, int $organizerUserId): array;
}
