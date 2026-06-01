<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Stage;

use App\Domain\Stage\Stage;
use App\Domain\Stage\StageRepository;
use PDO;

final class PdoStageRepository implements StageRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Stage
    {
        $stmt = $this->pdo->prepare('SELECT * FROM stages WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Stage::fromRow($row) : null;
    }

    /**
     * @return array<int,Stage>
     */
    public function findByTournament(int $tournamentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM stages WHERE tournament_id = :tournament_id ORDER BY position ASC, id ASC'
        );
        $stmt->execute(['tournament_id' => $tournamentId]);

        return array_map(
            static fn (array $row): Stage => Stage::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(int $tournamentId, array $data): Stage
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO stages
                (tournament_id, name, type, position, legs, tiebreakers, status, created_at, updated_at)
             VALUES
                (:tournament_id, :name, :type, :position, :legs, :tiebreakers, :status, NOW(), NOW())'
        );
        $stmt->execute([
            'tournament_id' => $tournamentId,
            'name'          => $data['name'],
            'type'          => $data['type'],
            'position'      => $data['position'],
            'legs'          => $data['legs'],
            'tiebreakers'   => $this->encodeTiebreakers($data['tiebreakers'] ?? null),
            'status'        => $data['status'] ?? 'pending',
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Stage $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Stage
    {
        $allowed = ['name', 'type', 'position', 'legs', 'status'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }
        if (array_key_exists('tiebreakers', $data)) {
            $sets[] = 'tiebreakers = :tiebreakers';
            $params['tiebreakers'] = $this->encodeTiebreakers($data['tiebreakers']);
        }

        if ($sets !== []) {
            $sql = 'UPDATE stages SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var Stage $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM stages WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    /**
     * @param array<int,mixed>|null $tiebreakers
     */
    private function encodeTiebreakers(?array $tiebreakers): ?string
    {
        if ($tiebreakers === null || $tiebreakers === []) {
            return null;
        }

        return json_encode(array_values($tiebreakers), JSON_UNESCAPED_UNICODE);
    }
}
