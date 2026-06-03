<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Tournament;

use App\Domain\Shared\Pagination;
use App\Domain\Tournament\Tournament;
use App\Domain\Tournament\TournamentRepository;
use PDO;

final class PdoTournamentRepository implements TournamentRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findById(int $id): ?Tournament
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tournaments WHERE id = :id AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? Tournament::fromRow($row) : null;
    }

    public function findBySlug(string $slug): ?Tournament
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tournaments WHERE slug = :slug AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute(['slug' => $slug]);
        $row = $stmt->fetch();

        return $row ? Tournament::fromRow($row) : null;
    }

    /**
     * @return array<int,Tournament>
     */
    public function findByOwner(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tournaments
             WHERE owner_user_id = :owner_user_id AND deleted_at IS NULL
             ORDER BY updated_at DESC'
        );
        $stmt->execute(['owner_user_id' => $userId]);

        return array_map(
            static fn (array $row): Tournament => Tournament::fromRow($row),
            $stmt->fetchAll()
        );
    }

    public function findByRegistrationCode(string $code): ?Tournament
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tournaments WHERE registration_code = :code AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute(['code' => $code]);
        $row = $stmt->fetch();

        return $row ? Tournament::fromRow($row) : null;
    }

    /**
     * Tournaments where the user holds at least one of the given per-tournament
     * roles. Deduped (a user may hold several role rows for one tournament) and
     * ordered newest first.
     *
     * @param array<int,string> $roles
     * @return array<int,Tournament>
     */
    public function findByMemberRoles(int $userId, array $roles): array
    {
        $roles = array_values(array_filter($roles, static fn ($r): bool => is_string($r) && $r !== ''));
        if ($roles === []) {
            return [];
        }

        $placeholders = [];
        $params = ['user_id' => $userId];
        foreach ($roles as $i => $role) {
            $key = "role$i";
            $placeholders[] = ":$key";
            $params[$key] = $role;
        }

        $sql = 'SELECT t.* FROM tournaments t
                INNER JOIN tournament_user_roles tur ON tur.tournament_id = t.id
                WHERE tur.user_id = :user_id
                  AND tur.role IN (' . implode(', ', $placeholders) . ')
                  AND t.deleted_at IS NULL
                GROUP BY t.id
                ORDER BY t.updated_at DESC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(
            static fn (array $row): Tournament => Tournament::fromRow($row),
            $stmt->fetchAll()
        );
    }

    public function slugExists(string $slug): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM tournaments WHERE slug = :slug LIMIT 1');
        $stmt->execute(['slug' => $slug]);

        return (bool) $stmt->fetchColumn();
    }

    public function registrationCodeExists(string $code): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM tournaments WHERE registration_code = :code LIMIT 1');
        $stmt->execute(['code' => $code]);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * @param array{sport_id?:?int,status?:?string,q?:?string} $filters
     * @return array<int,Tournament>
     */
    public function paginate(Pagination $pagination, array $filters): array
    {
        [$where, $params] = $this->buildFilters($filters);

        $sql = 'SELECT * FROM tournaments WHERE ' . $where
            . ' ORDER BY updated_at DESC LIMIT :limit OFFSET :offset';

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $pagination->limit(), PDO::PARAM_INT);
        $stmt->bindValue(':offset', $pagination->offset(), PDO::PARAM_INT);
        $stmt->execute();

        return array_map(
            static fn (array $row): Tournament => Tournament::fromRow($row),
            $stmt->fetchAll()
        );
    }

    /**
     * @param array{sport_id?:?int,status?:?string,q?:?string} $filters
     */
    public function countAll(array $filters): int
    {
        [$where, $params] = $this->buildFilters($filters);

        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM tournaments WHERE ' . $where);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * @param array<string,mixed> $data
     */
    public function create(array $data): Tournament
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO tournaments
                (sport_id, owner_user_id, name, slug, description, logo_url, status, is_public,
                 periods_count, points_win, points_draw, points_loss,
                 allow_late_registration, registration_open, registration_code,
                 starts_at, ends_at, timezone, rules, prizes,
                 suspension_red_card, suspension_double_yellow, roster_limit,
                 registration_info, created_at, updated_at)
             VALUES
                (:sport_id, :owner_user_id, :name, :slug, :description, :logo_url, :status, :is_public,
                 :periods_count, :points_win, :points_draw, :points_loss,
                 :allow_late_registration, :registration_open, :registration_code,
                 :starts_at, :ends_at, :timezone, :rules, :prizes,
                 :suspension_red_card, :suspension_double_yellow, :roster_limit,
                 :registration_info, NOW(), NOW())'
        );
        $stmt->execute([
            'sport_id'                 => $data['sport_id'],
            'owner_user_id'            => $data['owner_user_id'],
            'name'                     => $data['name'],
            'slug'                     => $data['slug'],
            'description'              => $data['description'] ?? null,
            'logo_url'                 => $data['logo_url'] ?? null,
            'status'                   => $data['status'] ?? 'registration',
            'is_public'                => !empty($data['is_public']) ? 1 : 0,
            'periods_count'            => $data['periods_count'],
            'points_win'               => $data['points_win'],
            'points_draw'              => $data['points_draw'],
            'points_loss'              => $data['points_loss'],
            'allow_late_registration'  => !empty($data['allow_late_registration']) ? 1 : 0,
            'registration_open'        => !empty($data['registration_open']) ? 1 : 0,
            'registration_code'        => $data['registration_code'] ?? null,
            'starts_at'                => $data['starts_at'] ?? null,
            'ends_at'                  => $data['ends_at'] ?? null,
            'timezone'                 => $data['timezone'] ?? 'America/Bogota',
            'rules'                    => $data['rules'] ?? null,
            'prizes'                   => $this->encodePrizes($data['prizes'] ?? null),
            'suspension_red_card'      => !empty($data['suspension_red_card']) ? 1 : 0,
            'suspension_double_yellow' => !empty($data['suspension_double_yellow']) ? 1 : 0,
            'roster_limit'             => $data['roster_limit'] ?? null,
            'registration_info'        => $data['registration_info'] ?? null,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        /** @var Tournament $created */
        $created = $this->findById($id);

        return $created;
    }

    /**
     * @param array<string,mixed> $data
     */
    public function update(int $id, array $data): Tournament
    {
        $allowed = [
            'name', 'slug', 'description', 'logo_url', 'status', 'is_public', 'periods_count',
            'points_win', 'points_draw', 'points_loss', 'allow_late_registration',
            'registration_open', 'registration_code', 'starts_at', 'ends_at',
            'timezone', 'rules', 'suspension_red_card', 'suspension_double_yellow',
            'roster_limit', 'registration_info',
        ];

        $booleans = [
            'is_public', 'allow_late_registration', 'registration_open',
            'suspension_red_card', 'suspension_double_yellow',
        ];

        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "$field = :$field";
                $value = $data[$field];
                if (in_array($field, $booleans, true)) {
                    $value = !empty($value) ? 1 : 0;
                }
                $params[$field] = $value;
            }
        }
        if (array_key_exists('prizes', $data)) {
            $sets[] = 'prizes = :prizes';
            $params['prizes'] = $this->encodePrizes($data['prizes']);
        }

        if ($sets !== []) {
            $sql = 'UPDATE tournaments SET ' . implode(', ', $sets)
                . ', updated_at = NOW() WHERE id = :id AND deleted_at IS NULL';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        /** @var Tournament $updated */
        $updated = $this->findById($id);

        return $updated;
    }

    public function softDelete(int $id): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE tournaments SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute(['id' => $id]);
    }

    /**
     * Serializes the prizes map for the JSON column. Mirrors the tiebreakers
     * handling on PdoStageRepository: an empty/absent map collapses to NULL.
     *
     * @param array<string,mixed>|null $prizes
     */
    private function encodePrizes(?array $prizes): ?string
    {
        if ($prizes === null || $prizes === []) {
            return null;
        }

        return json_encode($prizes, JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param array{sport_id?:?int,status?:?string,q?:?string,public_only?:?bool} $filters
     * @return array{0:string,1:array<string,mixed>}
     */
    private function buildFilters(array $filters): array
    {
        $clauses = ['deleted_at IS NULL'];
        $params = [];

        // Public listing: only visible tournaments, and never archived ones.
        if (!empty($filters['public_only'])) {
            $clauses[] = 'is_public = 1';
            $clauses[] = "status <> 'archived'";
        }

        if (!empty($filters['sport_id'])) {
            $clauses[] = 'sport_id = :sport_id';
            $params[':sport_id'] = (int) $filters['sport_id'];
        }
        if (!empty($filters['status'])) {
            $clauses[] = 'status = :status';
            $params[':status'] = (string) $filters['status'];
        }
        if (!empty($filters['q'])) {
            $clauses[] = 'name LIKE :q';
            $params[':q'] = '%' . $filters['q'] . '%';
        }

        return [implode(' AND ', $clauses), $params];
    }
}
