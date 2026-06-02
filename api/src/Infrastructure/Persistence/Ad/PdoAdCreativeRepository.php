<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Ad;

use App\Domain\Ad\AdCreative;
use App\Domain\Ad\AdCreativeRepository;
use PDO;

final class PdoAdCreativeRepository implements AdCreativeRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?AdCreative
    {
        $stmt = $this->pdo->prepare('SELECT * FROM ad_creatives WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? AdCreative::fromRow($row) : null;
    }

    /**
     * @return array<int,AdCreative>
     */
    public function findBySlot(int $slotId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM ad_creatives WHERE ad_slot_id = :slot ORDER BY updated_at DESC, id DESC'
        );
        $stmt->execute(['slot' => $slotId]);

        return array_map(
            static fn (array $row): AdCreative => AdCreative::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<int,int> $slotIds
     * @return array<int,AdCreative>
     */
    public function findActiveBySlotIds(array $slotIds): array
    {
        $ids = array_values(array_unique(array_map('intval', $slotIds)));
        if ($ids === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT * FROM ad_creatives
             WHERE is_active = 1 AND ad_slot_id IN ($placeholders)
             ORDER BY updated_at DESC, id DESC"
        );
        $stmt->execute($ids);

        return array_map(
            static fn (array $row): AdCreative => AdCreative::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): AdCreative
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO ad_creatives
                (ad_slot_id, media_type, media_url, cta_url, cta_label,
                 is_default, is_active, starts_at, ends_at, created_at, updated_at)
             VALUES
                (:ad_slot_id, :media_type, :media_url, :cta_url, :cta_label,
                 :is_default, :is_active, :starts_at, :ends_at, NOW(), NOW())'
        );
        $stmt->execute([
            'ad_slot_id' => $data['ad_slot_id'],
            'media_type' => $data['media_type'],
            'media_url'  => $data['media_url'],
            'cta_url'    => $data['cta_url'] ?? null,
            'cta_label'  => $data['cta_label'] ?? null,
            'is_default' => !empty($data['is_default']) ? 1 : 0,
            'is_active'  => array_key_exists('is_active', $data)
                ? (!empty($data['is_active']) ? 1 : 0)
                : 1,
            'starts_at'  => $data['starts_at'] ?? null,
            'ends_at'    => $data['ends_at'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var AdCreative $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): AdCreative
    {
        $allowed = [
            'media_type', 'media_url', 'cta_url', 'cta_label',
            'is_default', 'is_active', 'starts_at', 'ends_at',
        ];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $value = $data[$field];
                if (in_array($field, ['is_default', 'is_active'], true)) {
                    $value = !empty($value) ? 1 : 0;
                }
                $params[$field] = $value;
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE ad_creatives SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var AdCreative $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM ad_creatives WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
