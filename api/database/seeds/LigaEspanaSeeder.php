<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

/**
 * Demo data: "Liga España" — a Fútbol 5 tournament owned by the demo organizer
 * (organizador@torneos.test), with 19 La Liga teams (Real Madrid intentionally
 * left out so it can be registered as a delegate) and the 10 most-used real
 * starters (titulares, 2024-25 squads) per team, mapped to Fútbol 5 positions.
 * All teams are created by the organizer (the organizer is each team's
 * delegate_user_id) and approved.
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
        // Each team carries its 10 most-used starters (real squads, 2024-25
        // season). Positions are mapped to Fútbol 5 roles based on each player's
        // natural position: GK -> Portero, defenders -> Cierre, full-backs/wingers
        // -> Ala Derecha/Izquierda, forwards/strikers -> Pívot. Shirt numbers run
        // 1..10 in roster order; the player at index 0 wears #1 and is captain.
        // Format: [name, short, coach, [ [playerName, futsalPosition], ... x10 ]]
        $teams = [
            ['FC Barcelona', 'BAR', 'Hansi Flick', [
                ['Marc-André ter Stegen', 'Portero'],
                ['Jules Koundé', 'Cierre'],
                ['Pau Cubarsí', 'Cierre'],
                ['Íñigo Martínez', 'Cierre'],
                ['Alejandro Balde', 'Ala Izquierda'],
                ['Pedri González', 'Ala Derecha'],
                ['Frenkie de Jong', 'Cierre'],
                ['Lamine Yamal', 'Ala Derecha'],
                ['Raphinha', 'Ala Izquierda'],
                ['Robert Lewandowski', 'Pívot'],
            ]],
            ['Atlético de Madrid', 'ATM', 'Diego Simeone', [
                ['Jan Oblak', 'Portero'],
                ['José María Giménez', 'Cierre'],
                ['Robin Le Normand', 'Cierre'],
                ['Nahuel Molina', 'Ala Derecha'],
                ['Reinildo Mandava', 'Ala Izquierda'],
                ['Rodrigo De Paul', 'Ala Derecha'],
                ['Pablo Barrios', 'Cierre'],
                ['Marcos Llorente', 'Ala Derecha'],
                ['Antoine Griezmann', 'Pívot'],
                ['Julián Álvarez', 'Pívot'],
            ]],
            ['Athletic Club', 'ATH', 'Ernesto Valverde', [
                ['Unai Simón', 'Portero'],
                ['Dani Vivian', 'Cierre'],
                ['Aitor Paredes', 'Cierre'],
                ['Óscar de Marcos', 'Ala Derecha'],
                ['Yuri Berchiche', 'Ala Izquierda'],
                ['Mikel Vesga', 'Cierre'],
                ['Oihan Sancet', 'Ala Derecha'],
                ['Iñaki Williams', 'Ala Derecha'],
                ['Nico Williams', 'Ala Izquierda'],
                ['Gorka Guruzeta', 'Pívot'],
            ]],
            ['Real Sociedad', 'RSO', 'Imanol Alguacil', [
                ['Álex Remiro', 'Portero'],
                ['Aritz Elustondo', 'Cierre'],
                ['Igor Zubeldia', 'Cierre'],
                ['Hamari Traoré', 'Ala Derecha'],
                ['Aihen Muñoz', 'Ala Izquierda'],
                ['Martín Zubimendi', 'Cierre'],
                ['Brais Méndez', 'Ala Derecha'],
                ['Mikel Oyarzabal', 'Pívot'],
                ['Takefusa Kubo', 'Ala Derecha'],
                ['Sheraldo Becker', 'Pívot'],
            ]],
            ['Real Betis', 'BET', 'Manuel Pellegrini', [
                ['Rui Silva', 'Portero'],
                ['Héctor Bellerín', 'Ala Derecha'],
                ['Marc Bartra', 'Cierre'],
                ['Diego Llorente', 'Cierre'],
                ['Romain Perraud', 'Ala Izquierda'],
                ['Johnny Cardoso', 'Cierre'],
                ['Isco Alarcón', 'Ala Derecha'],
                ['Giovani Lo Celso', 'Ala Izquierda'],
                ['Vitor Roque', 'Pívot'],
                ['Cucho Hernández', 'Pívot'],
            ]],
            ['Villarreal CF', 'VIL', 'Marcelino García', [
                ['Diego Conde', 'Portero'],
                ['Juan Foyth', 'Cierre'],
                ['Logan Costa', 'Cierre'],
                ['Kiko Femenía', 'Ala Derecha'],
                ['Sergi Cardona', 'Ala Izquierda'],
                ['Dani Parejo', 'Cierre'],
                ['Santi Comesaña', 'Ala Derecha'],
                ['Yeremy Pino', 'Ala Derecha'],
                ['Álex Baena', 'Ala Izquierda'],
                ['Ayoze Pérez', 'Pívot'],
            ]],
            ['Valencia CF', 'VAL', 'Rubén Baraja', [
                ['Giorgi Mamardashvili', 'Portero'],
                ['Thierry Correia', 'Ala Derecha'],
                ['Cristhian Mosquera', 'Cierre'],
                ['César Tárrega', 'Cierre'],
                ['José Gayà', 'Ala Izquierda'],
                ['Pepelu', 'Cierre'],
                ['Javi Guerra', 'Ala Derecha'],
                ['Diego López', 'Ala Izquierda'],
                ['Luis Rioja', 'Ala Derecha'],
                ['Hugo Duro', 'Pívot'],
            ]],
            ['Sevilla FC', 'SEV', 'García Pimienta', [
                ['Ørjan Nyland', 'Portero'],
                ['Juanlu Sánchez', 'Ala Derecha'],
                ['Loïc Badé', 'Cierre'],
                ['Kike Salas', 'Cierre'],
                ['Adrià Pedrosa', 'Ala Izquierda'],
                ['Nemanja Gudelj', 'Cierre'],
                ['Saúl Ñíguez', 'Ala Derecha'],
                ['Lucas Ocampos', 'Ala Izquierda'],
                ['Dodi Lukébakio', 'Ala Derecha'],
                ['Isaac Romero', 'Pívot'],
            ]],
            ['Girona FC', 'GIR', 'Míchel Sánchez', [
                ['Paulo Gazzaniga', 'Portero'],
                ['Arnau Martínez', 'Ala Derecha'],
                ['Daley Blind', 'Cierre'],
                ['David López', 'Cierre'],
                ['Miguel Gutiérrez', 'Ala Izquierda'],
                ['Yangel Herrera', 'Cierre'],
                ['Iván Martín', 'Ala Derecha'],
                ['Viktor Tsygankov', 'Ala Derecha'],
                ['Bryan Gil', 'Ala Izquierda'],
                ['Abel Ruiz', 'Pívot'],
            ]],
            ['CA Osasuna', 'OSA', 'Vicente Moreno', [
                ['Sergio Herrera', 'Portero'],
                ['Jesús Areso', 'Ala Derecha'],
                ['Alejandro Catena', 'Cierre'],
                ['Enzo Boyomo', 'Cierre'],
                ['Bryan Zaragoza', 'Ala Izquierda'],
                ['Lucas Torró', 'Cierre'],
                ['Moi Gómez', 'Ala Derecha'],
                ['Aimar Oroz', 'Ala Derecha'],
                ['Rubén García', 'Ala Izquierda'],
                ['Ante Budimir', 'Pívot'],
            ]],
            ['Celta de Vigo', 'CEL', 'Claudio Giráldez', [
                ['Vicente Guaita', 'Portero'],
                ['Óscar Mingueza', 'Ala Derecha'],
                ['Carl Starfelt', 'Cierre'],
                ['Marcos Alonso', 'Cierre'],
                ['Carlos Domínguez', 'Cierre'],
                ['Ilaix Moriba', 'Ala Derecha'],
                ['Fran Beltrán', 'Cierre'],
                ['Hugo Álvarez', 'Ala Izquierda'],
                ['Borja Iglesias', 'Pívot'],
                ['Iago Aspas', 'Pívot'],
            ]],
            ['RCD Mallorca', 'MLL', 'Jagoba Arrasate', [
                ['Dominik Greif', 'Portero'],
                ['Pablo Maffeo', 'Ala Derecha'],
                ['Martin Valjent', 'Cierre'],
                ['Antonio Raíllo', 'Cierre'],
                ['Johan Mojica', 'Ala Izquierda'],
                ['Samú Costa', 'Cierre'],
                ['Sergi Darder', 'Ala Derecha'],
                ['Dani Rodríguez', 'Ala Izquierda'],
                ['Vedat Muriqi', 'Pívot'],
                ['Cyle Larin', 'Pívot'],
            ]],
            ['Rayo Vallecano', 'RAY', 'Iñigo Pérez', [
                ['Augusto Batalla', 'Portero'],
                ['Andrei Ratiu', 'Ala Derecha'],
                ['Florian Lejeune', 'Cierre'],
                ['Aridane Hernández', 'Cierre'],
                ['Pep Chavarría', 'Ala Izquierda'],
                ['Óscar Valentín', 'Cierre'],
                ['Pathé Ciss', 'Ala Derecha'],
                ['Isi Palazón', 'Ala Derecha'],
                ['Álvaro García', 'Ala Izquierda'],
                ['Jorge de Frutos', 'Pívot'],
            ]],
            ['RCD Espanyol', 'ESP', 'Manolo González', [
                ['Joan García', 'Portero'],
                ['Omar El Hilali', 'Ala Derecha'],
                ['Leandro Cabrera', 'Cierre'],
                ['Sergi Gómez', 'Cierre'],
                ['Carlos Romero', 'Ala Izquierda'],
                ['Pol Lozano', 'Cierre'],
                ['Edu Expósito', 'Ala Derecha'],
                ['Javi Puado', 'Ala Derecha'],
                ['Jofre Carreras', 'Ala Izquierda'],
                ['Roberto Fernández', 'Pívot'],
            ]],
            ['Getafe CF', 'GET', 'José Bordalás', [
                ['David Soria', 'Portero'],
                ['Damián Suárez', 'Ala Derecha'],
                ['Domingos Duarte', 'Cierre'],
                ['Omar Alderete', 'Cierre'],
                ['Diego Rico', 'Ala Izquierda'],
                ['Luis Milla', 'Cierre'],
                ['Christantus Uche', 'Ala Derecha'],
                ['Carles Pérez', 'Ala Derecha'],
                ['Yellu Santiago', 'Ala Izquierda'],
                ['Borja Mayoral', 'Pívot'],
            ]],
            ['Deportivo Alavés', 'ALA', 'Eduardo Coudet', [
                ['Antonio Sivera', 'Portero'],
                ['Nahuel Tenaglia', 'Ala Derecha'],
                ['Facundo Garcés', 'Cierre'],
                ['Abdel Abqar', 'Cierre'],
                ['Manu Sánchez', 'Ala Izquierda'],
                ['Antonio Blanco', 'Cierre'],
                ['Ander Guevara', 'Ala Derecha'],
                ['Carlos Vicente', 'Ala Derecha'],
                ['Carles Aleñá', 'Ala Izquierda'],
                ['Kike García', 'Pívot'],
            ]],
            ['UD Las Palmas', 'LPA', 'Diego Martínez', [
                ['Jasper Cillessen', 'Portero'],
                ['Álex Suárez', 'Cierre'],
                ['Scott McKenna', 'Cierre'],
                ['Sergi Cardona', 'Ala Izquierda'],
                ['Kirian Rodríguez', 'Cierre'],
                ['Javi Muñoz', 'Ala Derecha'],
                ['Alberto Moleiro', 'Ala Derecha'],
                ['Sandro Ramírez', 'Pívot'],
                ['Fábio Silva', 'Pívot'],
                ['Marc Cardona', 'Pívot'],
            ]],
            ['CD Leganés', 'LEG', 'Borja Jiménez', [
                ['Marko Dmitrović', 'Portero'],
                ['Adrià Altimira', 'Ala Derecha'],
                ['Jorge Sáenz', 'Cierre'],
                ['Sergio González', 'Cierre'],
                ['Valentín Rosier', 'Ala Izquierda'],
                ['Yvan Neyou', 'Cierre'],
                ['Darko Brašanac', 'Ala Derecha'],
                ['Óscar Rodríguez', 'Ala Izquierda'],
                ['Juan Cruz', 'Ala Derecha'],
                ['Miguel de la Fuente', 'Pívot'],
            ]],
            ['Real Valladolid', 'VLL', 'Diego Cocca', [
                ['Karl Hein', 'Portero'],
                ['Iván Fresneda', 'Ala Derecha'],
                ['Javi Sánchez', 'Cierre'],
                ['Eray Cömert', 'Cierre'],
                ['David Torres', 'Ala Izquierda'],
                ['Kike Pérez', 'Cierre'],
                ['Mario Martín', 'Ala Derecha'],
                ['Stanko Jurić', 'Ala Derecha'],
                ['Raúl Moro', 'Ala Izquierda'],
                ['Marcos André', 'Pívot'],
            ]],
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
        foreach ($teams as [$name, $short, $coach, $roster]) {
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

            // 10 real starting players, shirts 1..10, captain wears #1.
            foreach ($roster as $slot => [$playerName, $position]) {
                $docCounter++;
                $shirt = $slot + 1;

                $insertPlayer->execute([
                    ':org'  => $organizerId,
                    ':doc'  => 'ESP' . $docCounter,
                    ':name' => $playerName,
                    ':now'  => $now,
                ]);
                $playerId = (int) $pdo->lastInsertId();

                $insertTeamPlayer->execute([
                    ':ttid'     => $teamId,
                    ':pid'      => $playerId,
                    ':shirt'    => $shirt,
                    ':position' => $position,
                    ':captain'  => $shirt === 1 ? 1 : 0,
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
