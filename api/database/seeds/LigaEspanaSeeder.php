<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

/**
 * Demo data: "Liga España" — a Fútbol 5 tournament owned by the demo organizer
 * (organizador@torneos.test), with 19 La Liga teams (Real Madrid intentionally
 * left out so it can be registered as a delegate) and 10 starting players
 * (titulares) per team. All teams are created by the organizer (the organizer
 * is each team's delegate_user_id) and approved.
 *
 * Replaces the ad-hoc PowerShell bootstrap script: running `composer db:seed`
 * (or db:fresh) now repopulates this dataset. Idempotent — if a "Liga España"
 * tournament already exists for the organizer it is skipped.
 */
final class LigaEspanaSeeder extends AbstractSeed
{
    private const TOURNAMENT_NAME = 'Liga España';

    /**
     * @return array<int,string>
     */
    public function getDependencies(): array
    {
        return ['UserSeeder', 'SportSeeder'];
    }

    public function run(): void
    {
        $pdo = $this->getAdapter()->getConnection();
        $now = date('Y-m-d H:i:s');

        // Resolve the organizer (owner) and the Fútbol 5 sport.
        $organizerId = $this->scalar(
            'SELECT id FROM users WHERE email = :email LIMIT 1',
            [':email' => 'organizador@torneos.test']
        );
        $sportId = $this->scalar(
            "SELECT id FROM sports WHERE slug = 'futbol-5' LIMIT 1"
        );

        if ($organizerId === null || $sportId === null) {
            // Dependencies missing — nothing to seed.
            return;
        }
        $organizerId = (int) $organizerId;
        $sportId = (int) $sportId;

        // Idempotency: skip if the organizer already owns this tournament.
        $existing = $this->scalar(
            'SELECT id FROM tournaments WHERE owner_user_id = :owner AND name = :name LIMIT 1',
            [':owner' => $organizerId, ':name' => self::TOURNAMENT_NAME]
        );
        if ($existing !== null) {
            return;
        }

        // ---- Tournament (Fútbol 5, registrations open, private by default) ----
        $slug = 'liga-espana-' . $this->monthYearSuffix();
        $pdo->prepare(
            'INSERT INTO tournaments
                (sport_id, owner_user_id, name, slug, description, status, is_public,
                 periods_count, points_win, points_draw, points_loss,
                 allow_late_registration, registration_open, registration_code,
                 starts_at, timezone, created_at, updated_at)
             VALUES
                (:sport_id, :owner, :name, :slug, :description, :status, :is_public,
                 2, 3, 1, 0, 0, 1, :code, :starts_at, :timezone, :now, :now)'
        )->execute([
            ':sport_id'    => $sportId,
            ':owner'       => $organizerId,
            ':name'        => self::TOURNAMENT_NAME,
            ':slug'        => $slug,
            ':description' => 'La Liga - Fútbol 5',
            ':status'      => 'registration',
            ':is_public'   => 0,
            ':code'        => $this->registrationCode(),
            ':starts_at'   => '2026-08-15',
            ':timezone'    => 'Europe/Madrid',
            ':now'         => $now,
        ]);
        $tournamentId = (int) $pdo->lastInsertId();

        // Organizer role for the owner.
        $this->insertRole($tournamentId, $organizerId, 'organizer', null, $now);

        // ---- Teams (19 — Real Madrid intentionally excluded) ----
        $teams = [
            ['FC Barcelona', 'BAR', 'Hansi Flick'],
            ['Atlético de Madrid', 'ATM', 'Diego Simeone'],
            ['Athletic Club', 'ATH', 'Ernesto Valverde'],
            ['Real Sociedad', 'RSO', 'Imanol Alguacil'],
            ['Real Betis', 'BET', 'Manuel Pellegrini'],
            ['Villarreal CF', 'VIL', 'Marcelino García'],
            ['Valencia CF', 'VAL', 'Rubén Baraja'],
            ['Sevilla FC', 'SEV', 'García Pimienta'],
            ['Girona FC', 'GIR', 'Míchel Sánchez'],
            ['CA Osasuna', 'OSA', 'Vicente Moreno'],
            ['Celta de Vigo', 'CEL', 'Claudio Giráldez'],
            ['RCD Mallorca', 'MLL', 'Jagoba Arrasate'],
            ['Rayo Vallecano', 'RAY', 'Iñigo Pérez'],
            ['RCD Espanyol', 'ESP', 'Manolo González'],
            ['Getafe CF', 'GET', 'José Bordalás'],
            ['Deportivo Alavés', 'ALA', 'Eduardo Coudet'],
            ['UD Las Palmas', 'LPA', 'Diego Martínez'],
            ['CD Leganés', 'LEG', 'Borja Jiménez'],
            ['Real Valladolid', 'VLL', 'Diego Cocca'],
        ];

        // Player name pools + Fútbol 5 positions (10-man roster: 5 titulares +
        // 5 from the bench, mirroring the line-up the organizer pre-loaded).
        $nombres = [
            'Adrián', 'Alejandro', 'Álvaro', 'Andrés', 'Antonio', 'Carlos', 'Daniel',
            'David', 'Diego', 'Eduardo', 'Fernando', 'Francisco', 'Gonzalo', 'Hugo',
            'Iker', 'Javier', 'Jorge', 'José', 'Juan', 'Luis', 'Manuel', 'Marcos',
            'Mario', 'Miguel', 'Nicolás', 'Óscar', 'Pablo', 'Pedro', 'Rafael', 'Raúl',
        ];
        $apellidos = [
            'García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'González', 'Rodríguez',
            'Fernández', 'Gómez', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero',
            'Torres', 'Navarro', 'Ramírez', 'Gil', 'Serrano', 'Blanco', 'Suárez',
            'Castro', 'Ortega', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Medina',
            'Cortés', 'Garrido',
        ];
        $posiciones = [
            'Portero', 'Cierre', 'Ala Derecha', 'Ala Izquierda', 'Pívot',
            'Portero', 'Cierre', 'Ala Derecha', 'Ala Izquierda', 'Pívot',
        ];

        $insertTeam = $pdo->prepare(
            'INSERT INTO tournament_teams
                (tournament_id, name, short_name, coach_name, delegate_user_id, status, created_at, updated_at)
             VALUES (:tid, :name, :short, :coach, :delegate, :status, :now, :now)'
        );
        $insertRegistration = $pdo->prepare(
            'INSERT INTO registrations
                (tournament_id, tournament_team_id, channel, status, is_late, created_at, updated_at)
             VALUES (:tid, :ttid, :channel, :status, 0, :now, :now)'
        );
        $insertPlayer = $pdo->prepare(
            'INSERT INTO players
                (organizer_user_id, document_id, full_name, created_at, updated_at)
             VALUES (:org, :doc, :name, :now, :now)'
        );
        $insertTeamPlayer = $pdo->prepare(
            'INSERT INTO team_players
                (tournament_team_id, player_id, shirt_number, position, is_captain, status, created_at, updated_at)
             VALUES (:ttid, :pid, :shirt, :position, :captain, :status, :now, :now)'
        );

        $docCounter = 100000;
        foreach ($teams as $index => [$name, $short, $coach]) {
            $insertTeam->execute([
                ':tid'      => $tournamentId,
                ':name'     => $name,
                ':short'    => $short,
                ':coach'    => $coach,
                ':delegate' => $organizerId,
                ':status'   => 'approved',
                ':now'      => $now,
            ]);
            $teamId = (int) $pdo->lastInsertId();

            // Manual registration (approved) so it shows in the organizer inbox.
            $insertRegistration->execute([
                ':tid'     => $tournamentId,
                ':ttid'    => $teamId,
                ':channel' => 'manual',
                ':status'  => 'approved',
                ':now'     => $now,
            ]);

            // 10 starting players, shirts 1..10, captain wears #1.
            for ($i = 1; $i <= 10; $i++) {
                $docCounter++;
                $nombre = $nombres[($index * 7 + $i) % count($nombres)];
                $apellido = $apellidos[($index * 5 + $i) % count($apellidos)];

                $insertPlayer->execute([
                    ':org'  => $organizerId,
                    ':doc'  => 'ESP' . $docCounter,
                    ':name' => $nombre . ' ' . $apellido,
                    ':now'  => $now,
                ]);
                $playerId = (int) $pdo->lastInsertId();

                $insertTeamPlayer->execute([
                    ':ttid'     => $teamId,
                    ':pid'      => $playerId,
                    ':shirt'    => $i,
                    ':position' => $posiciones[$i - 1],
                    ':captain'  => $i === 1 ? 1 : 0,
                    ':status'   => 'active',
                    ':now'      => $now,
                ]);
            }
        }
    }

    private function insertRole(int $tournamentId, int $userId, string $role, ?int $teamId, string $now): void
    {
        $this->getAdapter()->getConnection()->prepare(
            'INSERT INTO tournament_user_roles
                (tournament_id, user_id, role, team_id, created_at, updated_at)
             VALUES (:tid, :uid, :role, :team, :now, :now)'
        )->execute([
            ':tid'  => $tournamentId,
            ':uid'  => $userId,
            ':role' => $role,
            ':team' => $teamId,
            ':now'  => $now,
        ]);
    }

    /**
     * @param array<string,mixed> $params
     */
    private function scalar(string $sql, array $params = []): mixed
    {
        $stmt = $this->getAdapter()->getConnection()->prepare($sql);
        $stmt->execute($params);
        $value = $stmt->fetchColumn();

        return $value === false ? null : $value;
    }

    private function monthYearSuffix(): string
    {
        $months = [
            1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
            5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto',
            9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
        ];
        $now = new \DateTimeImmutable('now');

        return $months[(int) $now->format('n')] . '-' . $now->format('Y');
    }

    private function registrationCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $max = strlen($alphabet) - 1;
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= $alphabet[random_int(0, $max)];
        }

        return $code;
    }
}
