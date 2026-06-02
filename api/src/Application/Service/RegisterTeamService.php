<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Domain\Player\PlayerRepository;
use App\Domain\Registration\Registration;
use App\Domain\Registration\RegistrationRepository;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Team\TeamRepository;
use App\Domain\TeamPlayer\TeamPlayerRepository;
use App\Domain\Tournament\Tournament;
use PDO;

/**
 * Coordinates the atomic self-registration flow (channel = self_link). Because
 * no transaction helper exists, this service injects the shared PDO singleton
 * plus the repositories and wraps the multi-table insert (team + delegate role
 * + optional delegate-player + registration) in a single transaction.
 *
 * This is the established transaction-coordinator pattern for Fase 3.
 */
final class RegisterTeamService
{
    public function __construct(
        private PDO $pdo,
        private TeamRepository $teams,
        private TournamentUserRoleRepository $roles,
        private PlayerRepository $players,
        private TeamPlayerRepository $teamPlayers,
        private RegistrationRepository $registrations
    ) {
    }

    /**
     * @param array<string,mixed> $input
     *   - delegate_user_id   int    (the registering user)
     *   - team_name          string
     *   - short_name         ?string
     *   - coach_name         ?string
     *   - logo_url           ?string
     *   - players            list<array<string,mixed>>  (>= 1 required)
     *       each: document_id (req), full_name (req), alias?, birthdate?,
     *       photo_url?, phone?, shirt_number?, position?, is_captain?, is_delegate?
     *   - is_late            bool
     *   - joined_at_round    ?int
     */
    public function execute(Tournament $tournament, array $input): Registration
    {
        $delegateUserId = (int) $input['delegate_user_id'];
        $organizerUserId = $tournament->ownerUserId;

        /** @var list<array<string,mixed>> $players */
        $players = is_array($input['players'] ?? null) ? array_values($input['players']) : [];
        if (count($players) < 1) {
            throw new ValidationException([
                'players' => 'Debes inscribir al menos un jugador.',
            ]);
        }

        // Roster cap (NULL = unlimited). The team starts empty, so this only
        // depends on how many players this single submission carries.
        if ($tournament->rosterLimit !== null && count($players) > $tournament->rosterLimit) {
            throw new ValidationException([
                'players' => "El equipo supera el límite de jugadores ({$tournament->rosterLimit}).",
            ]);
        }

        // Pre-validate the batch (identity + dorsal collisions) before any write.
        $seenDocuments = [];
        $seenShirts = [];
        foreach ($players as $index => $p) {
            $documentId = trim((string) ($p['document_id'] ?? ''));
            if ($documentId === '') {
                throw new ValidationException([
                    "players.$index.document_id" => 'La cédula del jugador es obligatoria.',
                ]);
            }
            $fullName = trim((string) ($p['full_name'] ?? ''));
            if ($fullName === '') {
                throw new ValidationException([
                    "players.$index.full_name" => 'El nombre del jugador es obligatorio.',
                ]);
            }
            if (isset($seenDocuments[$documentId])) {
                throw new ValidationException([
                    "players.$index.document_id" => 'La cédula está repetida en la lista de jugadores.',
                ]);
            }
            $seenDocuments[$documentId] = true;

            $shirt = isset($p['shirt_number']) && $p['shirt_number'] !== null && $p['shirt_number'] !== ''
                ? (int) $p['shirt_number']
                : null;
            if ($shirt !== null) {
                if (isset($seenShirts[$shirt])) {
                    throw new ValidationException([
                        "players.$index.shirt_number" => 'El dorsal está repetido en la lista de jugadores.',
                    ]);
                }
                $seenShirts[$shirt] = true;
            }
        }

        $this->pdo->beginTransaction();

        try {
            // 1) Create the team (pending).
            $team = $this->teams->create([
                'tournament_id'    => $tournament->id,
                'name'             => $input['team_name'],
                'short_name'       => $input['short_name'] ?? null,
                'coach_name'       => $input['coach_name'] ?? null,
                'logo_url'         => $input['logo_url'] ?? null,
                'delegate_user_id' => $delegateUserId,
                'status'           => 'pending',
            ]);

            // 2) Assign the delegate role bound to the new team.
            if (!$this->roles->exists($tournament->id, $delegateUserId, 'delegate', $team->id)) {
                $this->roles->create($tournament->id, $delegateUserId, 'delegate', $team->id);
            }

            // 3) Create/reuse each roster player under the OWNER organizer pool.
            foreach ($players as $p) {
                $documentId = trim((string) $p['document_id']);
                $fullName = trim((string) $p['full_name']);

                $player = $this->players->findByOrganizerAndDocument($organizerUserId, $documentId);
                if ($player === null) {
                    $player = $this->players->create([
                        'organizer_user_id' => $organizerUserId,
                        'user_id'           => null,
                        'document_id'       => $documentId,
                        'full_name'         => $fullName,
                        'alias'             => $p['alias'] ?? null,
                        'birthdate'         => $p['birthdate'] ?? null,
                        'photo_url'         => $p['photo_url'] ?? null,
                        'phone'             => $p['phone'] ?? null,
                    ]);
                }

                $shirtNumber = isset($p['shirt_number']) && $p['shirt_number'] !== null && $p['shirt_number'] !== ''
                    ? (int) $p['shirt_number']
                    : null;

                $this->teamPlayers->create([
                    'tournament_team_id' => $team->id,
                    'player_id'          => $player->id,
                    'shirt_number'       => $shirtNumber,
                    'position'           => $p['position'] ?? null,
                    'is_captain'         => !empty($p['is_captain']),
                    'is_delegate'        => !empty($p['is_delegate']),
                    'status'             => 'active',
                ]);
            }

            // 4) Record the registration (self_link, pending).
            $registration = $this->registrations->create([
                'tournament_id'      => $tournament->id,
                'tournament_team_id' => $team->id,
                'channel'            => 'self_link',
                'status'             => 'pending',
                'is_late'            => !empty($input['is_late']),
                'joined_at_round'    => $input['joined_at_round'] ?? null,
            ]);

            $this->pdo->commit();

            return $registration;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
