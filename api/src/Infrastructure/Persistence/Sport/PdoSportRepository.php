<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Sport;

use App\Domain\Sport\Sport;
use App\Domain\Sport\SportRepository;
use PDO;

final class PdoSportRepository implements SportRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Sport
    {
        $stmt = $this->pdo->prepare('SELECT * FROM sports WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Sport::fromRow($row) : null;
    }

    /**
     * @return array<int,Sport>
     */
    public function findAllActive(): array
    {
        $stmt = $this->pdo->query(
            'SELECT * FROM sports WHERE is_active = 1 ORDER BY name ASC'
        );

        return array_map(
            static fn (array $row): Sport => Sport::fromRow($row),
            $stmt->fetchAll()
        );
    }
}
