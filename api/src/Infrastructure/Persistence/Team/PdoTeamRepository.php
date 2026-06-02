<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Team;

use App\Domain\Shared\Pagination;
use App\Domain\Team\Team;
use App\Domain\Team\TeamRepository;
use PDO;

final class PdoTeamRepository implements TeamRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Team
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tournament_teams WHERE id = :id AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Team::fromRow($row) : null;
    }

    /**
     * @param array{status?:?string,q?:?string} $filters
     * @return array<int,Team>
     */
    public function paginateByTournament(int $tournamentId, Pagination $pagination, array $filters): array
    {
        [$where, $params] = $this->buildFilters($tournamentId, $filters);

        $sql = 'SELECT * FROM tournament_teams WHERE ' . $where
            . ' ORDER BY updated_at DESC LIMIT :limit OFFSET :offset';

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $pagination->limit(), PDO::PARAM_INT);
        $stmt->bindValue(':offset', $pagination->offset(), PDO::PARAM_INT);
        $stmt->execute();

        return array_map(
            static fn (array $row): Team => Team::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array{status?:?string,q?:?string} $filters
     */
    public function countByTournament(int $tournamentId, array $filters): int
    {
        [$where, $params] = $this->buildFilters($tournamentId, $filters);

        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM tournament_teams WHERE ' . $where);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Team
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO tournament_teams
                (tournament_id, name, short_name, logo_url, delegate_user_id, status,
                 created_at, updated_at)
             VALUES
                (:tournament_id, :name, :short_name, :logo_url, :delegate_user_id, :status,
                 NOW(), NOW())'
        );
        $stmt->execute([
            'tournament_id'    => $data['tournament_id'],
            'name'             => $data['name'],
            'short_name'       => $data['short_name'] ?? null,
            'logo_url'         => $data['logo_url'] ?? null,
            'delegate_user_id' => $data['delegate_user_id'] ?? null,
            'status'           => $data['status'] ?? 'pending',
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Team $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Team
    {
        $allowed = ['name', 'short_name', 'logo_url', 'delegate_user_id', 'status'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE tournament_teams SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id AND deleted_at IS NULL';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var Team $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function setStatus(int $id, string $status): Team
    {
        $stmt = $this->pdo->prepare(
            'UPDATE tournament_teams SET status = :status, updated_at = NOW()
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute(['status' => $status, 'id' => $id]);

        /** @var Team $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function softDelete(int $id): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE tournament_teams SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute(['id' => $id]);
    }

    /**
     * @param array{status?:?string,q?:?string} $filters
     * @return array{0:string,1:array<string,mixed>}
     */
    private function buildFilters(int $tournamentId, array $filters): array
    {
        $clauses = ['deleted_at IS NULL', 'tournament_id = :tournament_id'];
        $params = [':tournament_id' => $tournamentId];

        if (!empty($filters['status'])) {
            $clauses[] = 'status = :status';
            $params[':status'] = (string) $filters['status'];
        }
        if (!empty($filters['q'])) {
            $clauses[] = '(name LIKE :q OR short_name LIKE :q)';
            $params[':q'] = '%' . $filters['q'] . '%';
        }

        return [implode(' AND ', $clauses), $params];
    }
}
