<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\TeamPlayer;

use App\Domain\TeamPlayer\TeamPlayer;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use PDO;

final class PdoTeamPlayerRepository implements TeamPlayerRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?TeamPlayer
    {
        $stmt = $this->pdo->prepare(
            'SELECT tp.*, p.document_id, p.full_name, p.alias, p.birthdate, p.photo_url, p.phone
             FROM team_players tp
             INNER JOIN players p ON p.id = tp.player_id
             WHERE tp.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? TeamPlayer::fromRow($row) : null;
    }

    /**
     * @return array<int,TeamPlayer>
     */
    public function findByTeam(int $teamId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT tp.*, p.document_id, p.full_name, p.alias, p.birthdate, p.photo_url, p.phone
             FROM team_players tp
             INNER JOIN players p ON p.id = tp.player_id
             WHERE tp.tournament_team_id = :team_id
             ORDER BY (tp.shirt_number IS NULL), tp.shirt_number ASC, p.full_name ASC'
        );
        $stmt->execute(['team_id' => $teamId]);

        return array_map(
            static fn (array $row): TeamPlayer => TeamPlayer::fromRow($row),
            $stmt->fetchAll()
        );
    }

    public function countByTeam(int $teamId): int
    {
        // Mirrors findByTeam's scope (all roster rows for the team, no status filter).
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM team_players WHERE tournament_team_id = :team_id'
        );
        $stmt->execute(['team_id' => $teamId]);

        return (int) $stmt->fetchColumn();
    }

    public function existsForTeamAndPlayer(int $teamId, int $playerId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM team_players
             WHERE tournament_team_id = :team_id AND player_id = :player_id LIMIT 1'
        );
        $stmt->execute(['team_id' => $teamId, 'player_id' => $playerId]);

        return (bool) $stmt->fetchColumn();
    }

    public function shirtNumberTaken(int $teamId, int $shirtNumber, ?int $exceptId = null): bool
    {
        $sql = 'SELECT 1 FROM team_players
                WHERE tournament_team_id = :team_id AND shirt_number = :shirt_number';
        $params = ['team_id' => $teamId, 'shirt_number' => $shirtNumber];

        if ($exceptId !== null) {
            $sql .= ' AND id <> :except_id';
            $params['except_id'] = $exceptId;
        }
        $sql .= ' LIMIT 1';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): TeamPlayer
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO team_players
                (tournament_team_id, player_id, shirt_number, position, is_captain,
                 is_delegate, status, created_at, updated_at)
             VALUES
                (:tournament_team_id, :player_id, :shirt_number, :position, :is_captain,
                 :is_delegate, :status, NOW(), NOW())'
        );
        $stmt->execute([
            'tournament_team_id' => $data['tournament_team_id'],
            'player_id'          => $data['player_id'],
            'shirt_number'       => $data['shirt_number'] ?? null,
            'position'           => $data['position'] ?? null,
            'is_captain'         => !empty($data['is_captain']) ? 1 : 0,
            'is_delegate'        => !empty($data['is_delegate']) ? 1 : 0,
            'status'             => $data['status'] ?? 'active',
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var TeamPlayer $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): TeamPlayer
    {
        $allowed = ['shirt_number', 'position', 'is_captain', 'is_delegate', 'status'];
        $boolFields = ['is_captain', 'is_delegate'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $value = $data[$field];
                if (in_array($field, $boolFields, true)) {
                    $value = !empty($value) ? 1 : 0;
                }
                $params[$field] = $value;
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE team_players SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var TeamPlayer $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM team_players WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
