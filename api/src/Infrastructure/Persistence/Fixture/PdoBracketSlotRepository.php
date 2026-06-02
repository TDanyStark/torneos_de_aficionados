<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Fixture;

use App\Domain\Fixture\BracketSlot;
use App\Domain\Fixture\BracketSlotRepository;
use PDO;

final class PdoBracketSlotRepository implements BracketSlotRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?BracketSlot
    {
        $stmt = $this->pdo->prepare('SELECT * FROM bracket_slots WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? BracketSlot::fromRow($row) : null;
    }

    /**
     * @return array<int,BracketSlot>
     */
    public function findByStage(int $stageId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM bracket_slots
             WHERE stage_id = :stage_id
             ORDER BY round_number ASC, position ASC, id ASC'
        );
        $stmt->execute(['stage_id' => $stageId]);

        return array_map(
            static fn (array $row): BracketSlot => BracketSlot::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): BracketSlot
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO bracket_slots
                (stage_id, round_number, round_label, position, home_source,
                 away_source, next_slot_id, match_id, created_at, updated_at)
             VALUES
                (:stage_id, :round_number, :round_label, :position, :home_source,
                 :away_source, :next_slot_id, :match_id, NOW(), NOW())'
        );
        $stmt->execute([
            'stage_id'     => $data['stage_id'],
            'round_number' => $data['round_number'],
            'round_label'  => $data['round_label'] ?? null,
            'position'     => $data['position'],
            'home_source'  => $data['home_source'] ?? null,
            'away_source'  => $data['away_source'] ?? null,
            'next_slot_id' => $data['next_slot_id'] ?? null,
            'match_id'     => $data['match_id'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var BracketSlot $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): BracketSlot
    {
        $allowed = [
            'round_number', 'round_label', 'position',
            'home_source', 'away_source', 'next_slot_id', 'match_id',
        ];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE bracket_slots SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var BracketSlot $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM bracket_slots WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
