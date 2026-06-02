<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Ad;

use App\Domain\Ad\AdSlot;
use App\Domain\Ad\AdSlotRepository;
use PDO;

final class PdoAdSlotRepository implements AdSlotRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?AdSlot
    {
        $stmt = $this->pdo->prepare('SELECT * FROM ad_slots WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? AdSlot::fromRow($row) : null;
    }

    /**
     * @return array<int,AdSlot>
     */
    public function findGlobals(): array
    {
        $stmt = $this->pdo->query(
            'SELECT * FROM ad_slots WHERE tournament_id IS NULL ORDER BY placement ASC, id ASC'
        );

        return array_map(
            static fn (array $row): AdSlot => AdSlot::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @return array<int,AdSlot>
     */
    public function findByTournament(int $tournamentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM ad_slots WHERE tournament_id = :tid ORDER BY placement ASC, id ASC'
        );
        $stmt->execute(['tid' => $tournamentId]);

        return array_map(
            static fn (array $row): AdSlot => AdSlot::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @return array<int,AdSlot>
     */
    public function findAll(int $limit, int $offset): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM ad_slots ORDER BY updated_at DESC, id DESC LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(
            static fn (array $row): AdSlot => AdSlot::fromRow($row),
            $stmt->fetchAll()
        );
    }

    public function countAll(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM ad_slots')->fetchColumn();
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): AdSlot
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO ad_slots
                (tournament_id, placement, name, is_active, created_at, updated_at)
             VALUES
                (:tournament_id, :placement, :name, :is_active, NOW(), NOW())'
        );
        $stmt->execute([
            'tournament_id' => $data['tournament_id'] ?? null,
            'placement'     => $data['placement'],
            'name'          => $data['name'],
            'is_active'     => array_key_exists('is_active', $data)
                ? (!empty($data['is_active']) ? 1 : 0)
                : 1,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var AdSlot $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): AdSlot
    {
        $allowed = ['tournament_id', 'placement', 'name', 'is_active'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $value = $data[$field];
                if ($field === 'is_active') {
                    $value = !empty($value) ? 1 : 0;
                }
                $params[$field] = $value;
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE ad_slots SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var AdSlot $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM ad_slots WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
