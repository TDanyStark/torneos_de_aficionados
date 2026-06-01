<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\AdvancementRule;

use App\Domain\AdvancementRule\AdvancementRule;
use App\Domain\AdvancementRule\AdvancementRuleRepository;
use PDO;

final class PdoAdvancementRuleRepository implements AdvancementRuleRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?AdvancementRule
    {
        $stmt = $this->pdo->prepare('SELECT * FROM advancement_rules WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? AdvancementRule::fromRow($row) : null;
    }

    /**
     * @return array<int,AdvancementRule>
     */
    public function findByStage(int $stageId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM advancement_rules WHERE stage_id = :stage_id ORDER BY id ASC'
        );
        $stmt->execute(['stage_id' => $stageId]);

        return array_map(
            static fn (array $row): AdvancementRule => AdvancementRule::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(int $stageId, array $data): AdvancementRule
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO advancement_rules
                (stage_id, group_id, qualifies_count, eliminates_count, target_stage_id, created_at, updated_at)
             VALUES
                (:stage_id, :group_id, :qualifies_count, :eliminates_count, :target_stage_id, NOW(), NOW())'
        );
        $stmt->execute([
            'stage_id'         => $stageId,
            'group_id'         => $data['group_id'] ?? null,
            'qualifies_count'  => $data['qualifies_count'] ?? null,
            'eliminates_count' => $data['eliminates_count'] ?? null,
            'target_stage_id'  => $data['target_stage_id'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var AdvancementRule $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): AdvancementRule
    {
        $allowed = ['group_id', 'qualifies_count', 'eliminates_count', 'target_stage_id'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE advancement_rules SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var AdvancementRule $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM advancement_rules WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
