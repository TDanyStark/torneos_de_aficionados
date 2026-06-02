<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\GroupTeam;

use App\Domain\GroupTeam\GroupTeam;
use App\Domain\GroupTeam\GroupTeamRepository;
use PDO;

final class PdoGroupTeamRepository implements GroupTeamRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?GroupTeam
    {
        $stmt = $this->pdo->prepare(
            'SELECT gt.*, tt.name AS team_name
             FROM group_teams gt
             INNER JOIN tournament_teams tt ON tt.id = gt.tournament_team_id
             WHERE gt.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? GroupTeam::fromRow($row) : null;
    }

    /**
     * @return array<int,GroupTeam>
     */
    public function findByGroup(int $groupId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT gt.*, tt.name AS team_name
             FROM group_teams gt
             INNER JOIN tournament_teams tt ON tt.id = gt.tournament_team_id
             WHERE gt.group_id = :group_id
             ORDER BY (gt.seed IS NULL), gt.seed ASC, tt.name ASC'
        );
        $stmt->execute(['group_id' => $groupId]);

        return array_map(
            static fn (array $row): GroupTeam => GroupTeam::fromRow($row),
            $stmt->fetchAll()
        );
    }

    public function exists(int $groupId, int $tournamentTeamId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM group_teams
             WHERE group_id = :group_id AND tournament_team_id = :tournament_team_id LIMIT 1'
        );
        $stmt->execute([
            'group_id'           => $groupId,
            'tournament_team_id' => $tournamentTeamId,
        ]);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): GroupTeam
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO group_teams
                (group_id, tournament_team_id, seed, created_at, updated_at)
             VALUES
                (:group_id, :tournament_team_id, :seed, NOW(), NOW())'
        );
        $stmt->execute([
            'group_id'           => $data['group_id'],
            'tournament_team_id' => $data['tournament_team_id'],
            'seed'               => $data['seed'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var GroupTeam $created */
        $created = $this->findById($id);

        return $created;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM group_teams WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
