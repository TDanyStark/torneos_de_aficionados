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
     *   - logo_url           ?string
     *   - is_player          bool   (delegate also plays)
     *   - document_id        ?string (required if is_player)
     *   - full_name          ?string
     *   - birthdate/photo_url/phone ?string
     *   - shirt_number       ?int
     *   - position           ?string
     *   - is_captain         bool
     *   - is_late            bool
     *   - joined_at_round    ?int
     */
    public function execute(Tournament $tournament, array $input): Registration
    {
        $delegateUserId = (int) $input['delegate_user_id'];
        $organizerUserId = $tournament->ownerUserId;

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

            // 3) Optional: the delegate also plays -> create/reuse player + roster.
            if (!empty($input['is_player'])) {
                $documentId = trim((string) ($input['document_id'] ?? ''));
                if ($documentId === '') {
                    throw new ValidationException([
                        'document_id' => 'La cédula es obligatoria para inscribirte como jugador.',
                    ]);
                }

                $player = $this->players->findByOrganizerAndDocument($organizerUserId, $documentId);
                if ($player === null) {
                    $fullName = trim((string) ($input['full_name'] ?? ''));
                    if ($fullName === '') {
                        throw new ValidationException([
                            'full_name' => 'El nombre completo es obligatorio para inscribirte como jugador.',
                        ]);
                    }
                    $player = $this->players->create([
                        'organizer_user_id' => $organizerUserId,
                        'user_id'           => $delegateUserId,
                        'document_id'       => $documentId,
                        'full_name'         => $fullName,
                        'alias'             => $input['alias'] ?? null,
                        'birthdate'         => $input['birthdate'] ?? null,
                        'photo_url'         => $input['photo_url'] ?? null,
                        'phone'             => $input['phone'] ?? null,
                    ]);
                } elseif ($player->userId === null) {
                    // Link the pool player to the delegate account if not linked.
                    $player = $this->players->update($player->id, ['user_id' => $delegateUserId]);
                }

                $shirtNumber = isset($input['shirt_number']) && $input['shirt_number'] !== null
                    ? (int) $input['shirt_number']
                    : null;

                if ($shirtNumber !== null && $this->teamPlayers->shirtNumberTaken($team->id, $shirtNumber)) {
                    throw new ValidationException([
                        'shirt_number' => 'El dorsal ya está asignado en este equipo.',
                    ]);
                }

                // Enforce roster_limit (NULL = unlimited). The new team starts empty,
                // so this never blocks the first player when roster_limit >= 1, but the
                // guard is included for correctness and future custom-field wrapping.
                if ($tournament->rosterLimit !== null
                    && $this->teamPlayers->countByTeam($team->id) >= $tournament->rosterLimit) {
                    throw new ValidationException([
                        'document_id' => "El equipo alcanzó el límite de jugadores ({$tournament->rosterLimit}).",
                    ]);
                }

                $this->teamPlayers->create([
                    'tournament_team_id' => $team->id,
                    'player_id'          => $player->id,
                    'shirt_number'       => $shirtNumber,
                    'position'           => $input['position'] ?? null,
                    'is_captain'         => !empty($input['is_captain']),
                    'is_delegate'        => true,
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
