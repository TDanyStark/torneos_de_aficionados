<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Registration;

use App\Domain\Registration\Registration;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\Shared\Pagination;
use PDO;

final class PdoRegistrationRepository implements RegistrationRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Registration
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.*, tt.name AS team_name, tt.status AS team_status
             FROM registrations r
             INNER JOIN tournament_teams tt ON tt.id = r.tournament_team_id
             WHERE r.id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Registration::fromRow($row) : null;
    }

    public function findByTeam(int $teamId): ?Registration
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.*, tt.name AS team_name, tt.status AS team_status
             FROM registrations r
             INNER JOIN tournament_teams tt ON tt.id = r.tournament_team_id
             WHERE r.tournament_team_id = :team_id
             ORDER BY r.id DESC LIMIT 1'
        );
        $stmt->execute(['team_id' => $teamId]);
        $row = $stmt->fetch();

        return $row ? Registration::fromRow($row) : null;
    }

    /**
     * Inbox order: pending/submitted first (still-open ones on top), then
     * updated_at DESC.
     *
     * @return array<int,Registration>
     */
    public function paginateByTournament(int $tournamentId, Pagination $pagination): array
    {
        $sql = "SELECT r.*, tt.name AS team_name, tt.status AS team_status
                FROM registrations r
                INNER JOIN tournament_teams tt ON tt.id = r.tournament_team_id
                WHERE r.tournament_id = :tournament_id
                ORDER BY (r.status IN ('pending', 'submitted')) DESC, r.updated_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':tournament_id', $tournamentId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $pagination->limit(), PDO::PARAM_INT);
        $stmt->bindValue(':offset', $pagination->offset(), PDO::PARAM_INT);
        $stmt->execute();

        return array_map(
            static fn (array $row): Registration => Registration::fromRow($row),
            $stmt->fetchAll()
        );
    }

    public function countByTournament(int $tournamentId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM registrations WHERE tournament_id = :tournament_id'
        );
        $stmt->execute(['tournament_id' => $tournamentId]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public function findByDelegateUser(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT r.id AS registration_id,
                    r.status AS registration_status,
                    r.channel,
                    r.is_late,
                    r.created_at,
                    r.updated_at,
                    tt.id AS team_id,
                    tt.name AS team_name,
                    tt.status AS team_status,
                    t.id AS tournament_id,
                    t.name AS tournament_name,
                    t.slug AS tournament_slug,
                    t.logo_url AS tournament_logo_url,
                    t.status AS tournament_state
             FROM registrations r
             INNER JOIN tournament_teams tt ON tt.id = r.tournament_team_id
             INNER JOIN tournaments t ON t.id = r.tournament_id
             WHERE tt.delegate_user_id = :user_id
             ORDER BY r.updated_at DESC, r.id DESC"
        );
        $stmt->execute(['user_id' => $userId]);

        return $stmt->fetchAll();
    }

    /**
     * @return array<int,Registration>
     */
    public function findLateApprovedByTournament(int $tournamentId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT r.*, tt.name AS team_name, tt.status AS team_status
             FROM registrations r
             INNER JOIN tournament_teams tt ON tt.id = r.tournament_team_id
             WHERE r.tournament_id = :tournament_id
               AND r.is_late = 1
               AND tt.status = 'approved'
             ORDER BY (r.joined_at_round IS NULL), r.joined_at_round ASC, r.id ASC"
        );
        $stmt->execute(['tournament_id' => $tournamentId]);

        return array_map(
            static fn (array $row): Registration => Registration::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Registration
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO registrations
                (tournament_id, tournament_team_id, channel, status, is_late,
                 joined_at_round, created_at, updated_at)
             VALUES
                (:tournament_id, :tournament_team_id, :channel, :status, :is_late,
                 :joined_at_round, NOW(), NOW())'
        );
        $stmt->execute([
            'tournament_id'      => $data['tournament_id'],
            'tournament_team_id' => $data['tournament_team_id'],
            'channel'            => $data['channel'],
            'status'             => $data['status'] ?? 'pending',
            'is_late'            => !empty($data['is_late']) ? 1 : 0,
            'joined_at_round'    => $data['joined_at_round'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Registration $created */
        $created = $this->findById($id);

        return $created;
    }

    public function setStatus(int $id, string $status): Registration
    {
        $stmt = $this->pdo->prepare(
            'UPDATE registrations SET status = :status, updated_at = NOW() WHERE id = :id'
        );
        $stmt->execute(['status' => $status, 'id' => $id]);

        /** @var Registration $updated */
        $updated = $this->findById($id);

        return $updated;
    }
}
