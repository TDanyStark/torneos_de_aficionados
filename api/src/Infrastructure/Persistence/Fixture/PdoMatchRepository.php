<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Fixture;

use App\Domain\Fixture\Match_;
use App\Domain\Fixture\MatchRepository;
use PDO;

final class PdoMatchRepository implements MatchRepository
{
    /** Statuses that mean the match is consolidated and MUST NOT be deleted. */
    private const LOCKED_STATUSES = ['live', 'paused', 'finished', 'walkover'];

    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Match_
    {
        $stmt = $this->pdo->prepare('SELECT * FROM matches WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Match_::fromRow($row) : null;
    }

    /**
     * Matches of a tournament, optionally filtered by round/group/status. Ordered
     * by the owning round number ASC (calendar order), then match id.
     *
     * @param array<string,mixed> $filters round|group|status
     *
     * @return array<int,Match_>
     */
    public function findByTournament(int $tournamentId, array $filters = []): array
    {
        $where = ['m.tournament_id = :tournament_id'];
        $params = ['tournament_id' => $tournamentId];

        if (isset($filters['round']) && $filters['round'] !== null && $filters['round'] !== '') {
            $where[] = 'm.round_id = :round_id';
            $params['round_id'] = (int) $filters['round'];
        }
        if (isset($filters['group']) && $filters['group'] !== null && $filters['group'] !== '') {
            $where[] = 'm.group_id = :group_id';
            $params['group_id'] = (int) $filters['group'];
        }
        if (isset($filters['status']) && $filters['status'] !== null && $filters['status'] !== '') {
            $where[] = 'm.status = :status';
            $params['status'] = (string) $filters['status'];
        }

        $sql = 'SELECT m.*
                FROM matches m
                LEFT JOIN rounds r ON r.id = m.round_id
                WHERE ' . implode(' AND ', $where) . '
                ORDER BY (r.number IS NULL), r.number ASC, m.leg ASC, m.id ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(
            static fn (array $row): Match_ => Match_::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * Finished matches of a group, as raw rows (input to StandingsCalculator).
     *
     * @return array<int,array<string,mixed>>
     */
    public function findFinishedRowsByGroup(int $groupId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM matches
             WHERE group_id = :group_id AND status = 'finished'
             ORDER BY id ASC"
        );
        $stmt->execute(['group_id' => $groupId]);

        return $stmt->fetchAll();
    }

    /**
     * @return array<int,Match_>
     */
    public function findByRound(int $roundId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM matches WHERE round_id = :round_id ORDER BY leg ASC, id ASC'
        );
        $stmt->execute(['round_id' => $roundId]);

        return array_map(
            static fn (array $row): Match_ => Match_::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Match_
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO matches
                (tournament_id, stage_id, group_id, round_id, home_team_id, away_team_id,
                 home_score, away_score, winner_team_id, status, venue, scheduled_at,
                 started_at, finished_at, referee_user_id, leg, bracket_slot_id,
                 created_at, updated_at)
             VALUES
                (:tournament_id, :stage_id, :group_id, :round_id, :home_team_id, :away_team_id,
                 :home_score, :away_score, :winner_team_id, :status, :venue, :scheduled_at,
                 :started_at, :finished_at, :referee_user_id, :leg, :bracket_slot_id,
                 NOW(), NOW())'
        );
        $stmt->execute([
            'tournament_id'   => $data['tournament_id'],
            'stage_id'        => $data['stage_id'],
            'group_id'        => $data['group_id'] ?? null,
            'round_id'        => $data['round_id'] ?? null,
            'home_team_id'    => $data['home_team_id'] ?? null,
            'away_team_id'    => $data['away_team_id'] ?? null,
            'home_score'      => $data['home_score'] ?? null,
            'away_score'      => $data['away_score'] ?? null,
            'winner_team_id'  => $data['winner_team_id'] ?? null,
            'status'          => $data['status'] ?? 'scheduled',
            'venue'           => $data['venue'] ?? null,
            'scheduled_at'    => $data['scheduled_at'] ?? null,
            'started_at'      => $data['started_at'] ?? null,
            'finished_at'     => $data['finished_at'] ?? null,
            'referee_user_id' => $data['referee_user_id'] ?? null,
            'leg'             => $data['leg'] ?? 1,
            'bracket_slot_id' => $data['bracket_slot_id'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Match_ $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * Updates only the provided whitelisted fields (PUT match metadata + future
     * score consolidation). NULL is a valid value (e.g. clearing a referee).
     *
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Match_
    {
        $allowed = [
            'group_id', 'round_id', 'home_team_id', 'away_team_id',
            'home_score', 'away_score', 'winner_team_id', 'status',
            'venue', 'scheduled_at', 'started_at', 'finished_at',
            'referee_user_id', 'leg', 'bracket_slot_id',
        ];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if ($sets !== []) {
            $sql = 'UPDATE matches SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var Match_ $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM matches WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    /**
     * Deletes all NON-consolidated matches of a round (used during regenerate).
     * Locked matches (live/paused/finished/walkover) are never touched.
     */
    public function deleteUnplayedByRound(int $roundId): void
    {
        $placeholders = [];
        $params = ['round_id' => $roundId];
        foreach (self::LOCKED_STATUSES as $i => $status) {
            $key = "locked$i";
            $placeholders[] = ":$key";
            $params[$key] = $status;
        }

        $sql = 'DELETE FROM matches
                WHERE round_id = :round_id
                  AND status NOT IN (' . implode(', ', $placeholders) . ')';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
    }
}
