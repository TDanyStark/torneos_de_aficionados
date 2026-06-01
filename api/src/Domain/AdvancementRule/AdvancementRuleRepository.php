<?php

declare(strict_types=1);

namespace App\Domain\AdvancementRule;

/**
 * Contract for advancement rule persistence. Implemented in Infrastructure.
 */
interface AdvancementRuleRepository
{
    public function findById(int $id): ?AdvancementRule;

    /**
     * @return array<int,AdvancementRule>
     */
    public function findByStage(int $stageId): array;

    /**
     * @param array<string,mixed> $data
     */
    public function create(int $stageId, array $data): AdvancementRule;

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): AdvancementRule;

    public function delete(int $id): void;
}
