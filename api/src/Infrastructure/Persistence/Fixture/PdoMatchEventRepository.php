<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Fixture;

use App\Domain\Fixture\MatchEvent;
use App\Domain\Fixture\MatchEventRepository;
use PDO;

final class PdoMatchEventRepository implements MatchEventRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?MatchEvent
    {
        $stmt = $this->pdo->prepare('SELECT * FROM match_events WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? MatchEvent::fromRow($row) : null;
    }

    /**
     * @return array<int,MatchEvent>
     */
    public function findByMatch(int $matchId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM match_events WHERE match_id = :match_id ORDER BY id ASC'
        );
        $stmt->execute(['match_id' => $matchId]);

        return array_map(
            static fn (array $row): MatchEvent => MatchEvent::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): MatchEvent
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO match_events
                (match_id, match_period_id, type, team_id, player_id, minute,
                 created_by_user_id, created_at, updated_at)
             VALUES
                (:match_id, :match_period_id, :type, :team_id, :player_id, :minute,
                 :created_by_user_id, NOW(), NOW())'
        );
        $stmt->execute([
            'match_id'           => $data['match_id'],
            'match_period_id'    => $data['match_period_id'] ?? null,
            'type'               => $data['type'],
            'team_id'            => $data['team_id'] ?? null,
            'player_id'          => $data['player_id'] ?? null,
            'minute'             => $data['minute'] ?? null,
            'created_by_user_id' => $data['created_by_user_id'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var MatchEvent $created */
        $created = $this->findById($id);

        return $created;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM match_events WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    /**
     * Goals per player (type = 'goal' only — own_goal excluded). One row per
     * player, ordered by goals DESC then player name. Player name from players,
     * team name from tournament_teams (the team credited on the goal event).
     *
     * @return array<int,array<string,mixed>>
     */
    public function topScorers(int $tournamentId, int $limit, int $offset): array
    {
        $sql = "SELECT
                    me.player_id            AS player_id,
                    p.full_name             AS player_name,
                    MAX(me.team_id)         AS team_id,
                    MAX(tt.name)            AS team_name,
                    COUNT(*)                AS goals
                FROM match_events me
                INNER JOIN matches m ON m.id = me.match_id
                INNER JOIN players p ON p.id = me.player_id
                LEFT JOIN tournament_teams tt ON tt.id = me.team_id
                WHERE m.tournament_id = :tournament_id
                  AND me.type = 'goal'
                  AND me.player_id IS NOT NULL
                GROUP BY me.player_id, p.full_name
                ORDER BY goals DESC, player_name ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue('tournament_id', $tournamentId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'player_id'   => (int) $row['player_id'],
                'player_name' => (string) $row['player_name'],
                'team_id'     => $row['team_id'] !== null ? (int) $row['team_id'] : null,
                'team_name'   => $row['team_name'] !== null ? (string) $row['team_name'] : null,
                'goals'       => (int) $row['goals'],
            ];
        }, $stmt->fetchAll());
    }

    public function countTopScorers(int $tournamentId): int
    {
        $sql = "SELECT COUNT(*) FROM (
                    SELECT me.player_id
                    FROM match_events me
                    INNER JOIN matches m ON m.id = me.match_id
                    WHERE m.tournament_id = :tournament_id
                      AND me.type = 'goal'
                      AND me.player_id IS NOT NULL
                    GROUP BY me.player_id
                ) AS scorers";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['tournament_id' => $tournamentId]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Discipline per player: yellow_card and red_card counts. One row per
     * player, ordered by reds DESC then yellows DESC.
     *
     * @return array<int,array<string,mixed>>
     */
    public function cardsByPlayer(int $tournamentId, int $limit, int $offset): array
    {
        $sql = "SELECT
                    me.player_id AS player_id,
                    p.full_name  AS player_name,
                    MAX(me.team_id) AS team_id,
                    MAX(tt.name)    AS team_name,
                    COALESCE(SUM(CASE WHEN me.type = 'yellow_card' THEN 1 ELSE 0 END), 0) AS yellow_cards,
                    COALESCE(SUM(CASE WHEN me.type = 'red_card' THEN 1 ELSE 0 END), 0)    AS red_cards
                FROM match_events me
                INNER JOIN matches m ON m.id = me.match_id
                INNER JOIN players p ON p.id = me.player_id
                LEFT JOIN tournament_teams tt ON tt.id = me.team_id
                WHERE m.tournament_id = :tournament_id
                  AND me.type IN ('yellow_card', 'red_card')
                  AND me.player_id IS NOT NULL
                GROUP BY me.player_id, p.full_name
                ORDER BY red_cards DESC, yellow_cards DESC, player_name ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue('tournament_id', $tournamentId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static function (array $row): array {
            return [
                'player_id'    => (int) $row['player_id'],
                'player_name'  => (string) $row['player_name'],
                'team_id'      => $row['team_id'] !== null ? (int) $row['team_id'] : null,
                'team_name'    => $row['team_name'] !== null ? (string) $row['team_name'] : null,
                'yellow_cards' => (int) $row['yellow_cards'],
                'red_cards'    => (int) $row['red_cards'],
            ];
        }, $stmt->fetchAll());
    }

    public function countCardsByPlayer(int $tournamentId): int
    {
        $sql = "SELECT COUNT(*) FROM (
                    SELECT me.player_id
                    FROM match_events me
                    INNER JOIN matches m ON m.id = me.match_id
                    WHERE m.tournament_id = :tournament_id
                      AND me.type IN ('yellow_card', 'red_card')
                      AND me.player_id IS NOT NULL
                    GROUP BY me.player_id
                ) AS carded";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['tournament_id' => $tournamentId]);

        return (int) $stmt->fetchColumn();
    }
}
