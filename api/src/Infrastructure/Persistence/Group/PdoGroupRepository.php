<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Group;

use App\Domain\Group\Group;
use App\Domain\Group\GroupRepository;
use PDO;

final class PdoGroupRepository implements GroupRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Group
    {
        $stmt = $this->pdo->prepare('SELECT * FROM groups WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Group::fromRow($row) : null;
    }

    /**
     * @return array<int,Group>
     */
    public function findByStage(int $stageId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM groups WHERE stage_id = :stage_id ORDER BY position ASC, id ASC'
        );
        $stmt->execute(['stage_id' => $stageId]);

        return array_map(
            static fn (array $row): Group => Group::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(int $stageId, array $data): Group
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO groups (stage_id, name, position, created_at, updated_at)
             VALUES (:stage_id, :name, :position, NOW(), NOW())'
        );
        $stmt->execute([
            'stage_id' => $stageId,
            'name'     => $data['name'],
            'position' => $data['position'],
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Group $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Group
    {
        $allowed = ['name', 'position'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE groups SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var Group $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM groups WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
