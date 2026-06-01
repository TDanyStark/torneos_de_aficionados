<?php

declare(strict_types=1);

namespace App\Domain\Sport;

/**
 * Contract for the (read-only) sports catalog. Implemented in Infrastructure.
 */
interface SportRepository
{
    public function findById(int $id): ?Sport;

    /**
     * Active sports, ordered for display.
     *
     * @return array<int,Sport>
     */
    public function findAllActive(): array;
}
