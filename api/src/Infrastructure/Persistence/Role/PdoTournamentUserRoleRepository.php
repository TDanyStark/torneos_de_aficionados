<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Role;

use App\Domain\Role\TournamentUserRole;
use App\Domain\Role\TournamentUserRoleRepository;
use PDO;

final class PdoTournamentUserRoleRepository implements TournamentUserRoleRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?TournamentUserRole
    {
        $stmt = $this->pdo->prepare(
            'SELECT tur.*, u.name AS user_name, u.email AS user_email
             FROM tournament_user_roles tur
             INNER JOIN users u ON u.id = tur.user_id
             WHERE tur.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? TournamentUserRole::fromRow($row) : null;
    }

    /**
     * @return array<int,TournamentUserRole>
     */
    public function findByTournament(int $tournamentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT tur.*, u.name AS user_name, u.email AS user_email
             FROM tournament_user_roles tur
             INNER JOIN users u ON u.id = tur.user_id
             WHERE tur.tournament_id = :tournament_id
             ORDER BY tur.role ASC, u.name ASC'
        );
        $stmt->execute(['tournament_id' => $tournamentId]);

        return array_map(
            static fn (array $row): TournamentUserRole => TournamentUserRole::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @return array<int,string>
     */
    public function rolesForUserInTournament(int $userId, int $tournamentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT DISTINCT role FROM tournament_user_roles
             WHERE user_id = :user_id AND tournament_id = :tournament_id'
        );
        $stmt->execute(['user_id' => $userId, 'tournament_id' => $tournamentId]);

        return array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /**
     * @return array<int,TournamentUserRole>
     */
    public function findByUser(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tournament_user_roles
             WHERE user_id = :user_id
             ORDER BY tournament_id ASC, role ASC'
        );
        $stmt->execute(['user_id' => $userId]);

        return array_map(
            static fn (array $row): TournamentUserRole => TournamentUserRole::fromRow($row),
            $stmt->fetchAll()
        );
    }

    public function exists(int $tournamentId, int $userId, string $role, ?int $teamId): bool
    {
        if ($teamId === null) {
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM tournament_user_roles
                 WHERE tournament_id = :tournament_id AND user_id = :user_id
                   AND role = :role AND team_id IS NULL LIMIT 1'
            );
            $stmt->execute([
                'tournament_id' => $tournamentId,
                'user_id'       => $userId,
                'role'          => $role,
            ]);
        } else {
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM tournament_user_roles
                 WHERE tournament_id = :tournament_id AND user_id = :user_id
                   AND role = :role AND team_id = :team_id LIMIT 1'
            );
            $stmt->execute([
                'tournament_id' => $tournamentId,
                'user_id'       => $userId,
                'role'          => $role,
                'team_id'       => $teamId,
            ]);
        }

        return (bool) $stmt->fetchColumn();
    }

    public function create(int $tournamentId, int $userId, string $role, ?int $teamId): TournamentUserRole
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO tournament_user_roles
                (tournament_id, user_id, role, team_id, created_at, updated_at)
             VALUES
                (:tournament_id, :user_id, :role, :team_id, NOW(), NOW())'
        );
        $stmt->execute([
            'tournament_id' => $tournamentId,
            'user_id'       => $userId,
            'role'          => $role,
            'team_id'       => $teamId,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var TournamentUserRole $created */
        $created = $this->findById($id);

        return $created;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM tournament_user_roles WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
