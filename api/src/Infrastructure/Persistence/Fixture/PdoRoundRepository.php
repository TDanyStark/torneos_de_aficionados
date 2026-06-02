<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Fixture;

use App\Domain\Fixture\Round;
use App\Domain\Fixture\RoundRepository;
use PDO;

final class PdoRoundRepository implements RoundRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Round
    {
        $stmt = $this->pdo->prepare('SELECT * FROM rounds WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Round::fromRow($row) : null;
    }

    /**
     * @return array<int,Round>
     */
    public function findByStage(int $stageId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM rounds WHERE stage_id = :stage_id ORDER BY number ASC, id ASC'
        );
        $stmt->execute(['stage_id' => $stageId]);

        return array_map(
            static fn (array $row): Round => Round::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * Rounds of a whole tournament (joined through stages) ordered by number ASC.
     *
     * @return array<int,Round>
     */
    public function findByTournament(int $tournamentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.*
             FROM rounds r
             INNER JOIN stages s ON s.id = r.stage_id
             WHERE s.tournament_id = :tournament_id
             ORDER BY r.number ASC, r.id ASC'
        );
        $stmt->execute(['tournament_id' => $tournamentId]);

        return array_map(
            static fn (array $row): Round => Round::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Round
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO rounds
                (stage_id, group_id, number, name, scheduled_date, status, created_at, updated_at)
             VALUES
                (:stage_id, :group_id, :number, :name, :scheduled_date, :status, NOW(), NOW())'
        );
        $stmt->execute([
            'stage_id'       => $data['stage_id'],
            'group_id'       => $data['group_id'] ?? null,
            'number'         => $data['number'],
            'name'           => $data['name'] ?? null,
            'scheduled_date' => $data['scheduled_date'] ?? null,
            'status'         => $data['status'] ?? 'pending',
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Round $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Round
    {
        $allowed = ['group_id', 'number', 'name', 'scheduled_date', 'status'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE rounds SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var Round $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM rounds WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
