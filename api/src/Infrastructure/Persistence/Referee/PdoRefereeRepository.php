<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Referee;

use App\Domain\Referee\Referee;
use App\Domain\Referee\RefereeRepository;
use PDO;

final class PdoRefereeRepository implements RefereeRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Referee
    {
        $stmt = $this->pdo->prepare('SELECT * FROM referees WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Referee::fromRow($row) : null;
    }

    /**
     * @return array<int,Referee>
     */
    public function findByTournament(int $tournamentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM referees WHERE tournament_id = :tournament_id ORDER BY name ASC, id ASC'
        );
        $stmt->execute(['tournament_id' => $tournamentId]);

        return array_map(
            static fn (array $row): Referee => Referee::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(int $tournamentId, array $data): Referee
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO referees (tournament_id, name, created_at, updated_at)
             VALUES (:tournament_id, :name, NOW(), NOW())'
        );
        $stmt->execute([
            'tournament_id' => $tournamentId,
            'name'          => $data['name'],
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Referee $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Referee
    {
        $allowed = ['name'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE referees SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var Referee $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM referees WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
