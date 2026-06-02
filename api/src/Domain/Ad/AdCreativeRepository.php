<?php

declare(strict_types=1);

namespace App\Domain\Ad;

/**
 * Contract for ad_creatives persistence. Implemented in Infrastructure.
 */
interface AdCreativeRepository
{
    public function findById(int $id): ?AdCreative;

    /**
     * All creatives for a slot, ordered (newest first).
     *
     * @return array<int,AdCreative>
     */
    public function findBySlot(int $slotId): array;

    /**
     * All is_active creatives for the given slot ids, as a flat array. Used by
     * the CreativeResolver for bulk load — the resolver groups by ad_slot_id.
     * Empty input returns an empty array (no query).
     *
     * @param array<int,int> $slotIds
     * @return array<int,AdCreative>
     */
    public function findActiveBySlotIds(array $slotIds): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): AdCreative;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): AdCreative;

    public function delete(int $id): void;
}
