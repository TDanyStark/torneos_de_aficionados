<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Fixture;

use App\Domain\Fixture\MatchPeriod;
use App\Domain\Fixture\MatchPeriodRepository;
use PDO;

final class PdoMatchPeriodRepository implements MatchPeriodRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?MatchPeriod
    {
        $stmt = $this->pdo->prepare('SELECT * FROM match_periods WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? MatchPeriod::fromRow($row) : null;
    }

    /**
     * @return array<int,MatchPeriod>
     */
    public function findByMatch(int $matchId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM match_periods WHERE match_id = :match_id ORDER BY number ASC'
        );
        $stmt->execute(['match_id' => $matchId]);

        return array_map(
            static fn (array $row): MatchPeriod => MatchPeriod::fromRow($row),
            $stmt->fetchAll()
        );
    }

    public function findActiveByMatch(int $matchId): ?MatchPeriod
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM match_periods
             WHERE match_id = :match_id AND status = 'running'
             ORDER BY number ASC
             LIMIT 1"
        );
        $stmt->execute(['match_id' => $matchId]);
        $row = $stmt->fetch();

        return $row ? MatchPeriod::fromRow($row) : null;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): MatchPeriod
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO match_periods
                (match_id, number, status, started_at, ended_at, created_at, updated_at)
             VALUES
                (:match_id, :number, :status, :started_at, :ended_at, NOW(), NOW())'
        );
        $stmt->execute([
            'match_id'   => $data['match_id'],
            'number'     => $data['number'],
            'status'     => $data['status'] ?? 'pending',
            'started_at' => $data['started_at'] ?? null,
            'ended_at'   => $data['ended_at'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var MatchPeriod $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): MatchPeriod
    {
        $allowed = ['status', 'started_at', 'ended_at', 'number'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE match_periods SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var MatchPeriod $updated */
        $updated = $this->findById($id);

        return $updated;
    }
}
