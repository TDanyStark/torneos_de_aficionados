<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Player;

use App\Domain\Player\Player;
use App\Domain\Player\PlayerRepository;
use PDO;

final class PdoPlayerRepository implements PlayerRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Player
    {
        $stmt = $this->pdo->prepare('SELECT * FROM players WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Player::fromRow($row) : null;
    }

    public function findByOrganizerAndDocument(int $organizerUserId, string $documentId): ?Player
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM players
             WHERE organizer_user_id = :organizer_user_id AND document_id = :document_id
             LIMIT 1'
        );
        $stmt->execute([
            'organizer_user_id' => $organizerUserId,
            'document_id'       => $documentId,
        ]);
        $row = $stmt->fetch();

        return $row ? Player::fromRow($row) : null;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Player
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO players
                (organizer_user_id, user_id, document_id, full_name, birthdate, photo_url,
                 phone, created_at, updated_at)
             VALUES
                (:organizer_user_id, :user_id, :document_id, :full_name, :birthdate, :photo_url,
                 :phone, NOW(), NOW())'
        );
        $stmt->execute([
            'organizer_user_id' => $data['organizer_user_id'],
            'user_id'           => $data['user_id'] ?? null,
            'document_id'       => $data['document_id'],
            'full_name'         => $data['full_name'],
            'birthdate'         => $data['birthdate'] ?? null,
            'photo_url'         => $data['photo_url'] ?? null,
            'phone'             => $data['phone'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Player $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Player
    {
        $allowed = ['user_id', 'full_name', 'birthdate', 'photo_url', 'phone'];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE players SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var Player $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    /**
     * History derivation: every team the player appeared in, restricted to the
     * owning organizer's tournaments. Goals/cards come from match_events which is
     * a Fase 4 table — until it exists those aggregates are returned as 0 so the
     * endpoint never crashes.
     *
     * @return array<int,array<string,mixed>>
     */
    public function historyForOrganizer(int $playerId, int $organizerUserId): array
    {
        $hasMatchEvents = $this->tableExists('match_events');

        if ($hasMatchEvents) {
            // Defensive design for Fase 4: aggregate goals/cards from match_events.
            $sql = "SELECT
                        t.id   AS tournament_id,
                        t.name AS tournament_name,
                        t.slug AS tournament_slug,
                        t.status AS tournament_status,
                        tt.id   AS team_id,
                        tt.name AS team_name,
                        tp.shirt_number,
                        tp.position,
                        tp.is_captain,
                        tp.is_delegate,
                        COALESCE(SUM(CASE WHEN me.type = 'goal' THEN 1 ELSE 0 END), 0) AS goals,
                        COALESCE(SUM(CASE WHEN me.type IN ('yellow_card','red_card') THEN 1 ELSE 0 END), 0) AS cards
                    FROM team_players tp
                    INNER JOIN tournament_teams tt ON tt.id = tp.tournament_team_id
                    INNER JOIN tournaments t ON t.id = tt.tournament_id
                    LEFT JOIN match_events me ON me.player_id = tp.player_id
                    WHERE tp.player_id = :player_id
                      AND t.owner_user_id = :organizer_user_id
                      AND t.deleted_at IS NULL
                      AND tt.deleted_at IS NULL
                    GROUP BY t.id, tt.id, tp.id
                    ORDER BY t.created_at DESC, tt.name ASC";
        } else {
            // Fase 3: match_events does not exist yet -> goals/cards stubbed at 0.
            $sql = "SELECT
                        t.id   AS tournament_id,
                        t.name AS tournament_name,
                        t.slug AS tournament_slug,
                        t.status AS tournament_status,
                        tt.id   AS team_id,
                        tt.name AS team_name,
                        tp.shirt_number,
                        tp.position,
                        tp.is_captain,
                        tp.is_delegate,
                        0 AS goals,
                        0 AS cards
                    FROM team_players tp
                    INNER JOIN tournament_teams tt ON tt.id = tp.tournament_team_id
                    INNER JOIN tournaments t ON t.id = tt.tournament_id
                    WHERE tp.player_id = :player_id
                      AND t.owner_user_id = :organizer_user_id
                      AND t.deleted_at IS NULL
                      AND tt.deleted_at IS NULL
                    ORDER BY t.created_at DESC, tt.name ASC";
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'player_id'         => $playerId,
            'organizer_user_id' => $organizerUserId,
        ]);

        return array_map(static function (array $row): array {
            return [
                'tournament_id'     => (int) $row['tournament_id'],
                'tournament_name'   => (string) $row['tournament_name'],
                'tournament_slug'   => (string) $row['tournament_slug'],
                'tournament_status' => (string) $row['tournament_status'],
                'team_id'           => (int) $row['team_id'],
                'team_name'         => (string) $row['team_name'],
                'shirt_number'      => $row['shirt_number'] !== null ? (int) $row['shirt_number'] : null,
                'position'          => $row['position'] !== null ? (string) $row['position'] : null,
                'is_captain'        => (bool) $row['is_captain'],
                'is_delegate'       => (bool) $row['is_delegate'],
                'goals'             => (int) $row['goals'],
                'cards'             => (int) $row['cards'],
            ];
        }, $stmt->fetchAll());
    }

    private function tableExists(string $table): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = :t LIMIT 1'
        );
        $stmt->execute(['t' => $table]);

        return (bool) $stmt->fetchColumn();
    }
}
