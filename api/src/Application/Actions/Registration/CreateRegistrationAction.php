<?php

declare(strict_types=1);

namespace App\Application\Actions\Registration;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Application\Service\RegisterTeamService;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/tournaments/{id}/registrations  (authenticated delegate, code-gated)
 * Self-registration via the public registration code. Authorization is by the
 * registration_code, NOT a pre-existing role — the delegate role is created here.
 * The whole operation (team + role + optional delegate-player + registration) is
 * atomic via RegisterTeamService. Late registration is flagged when the
 * tournament is in_progress and allows it. {id} is the tournament id.
 */
final class CreateRegistrationAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private RegisterTeamService $registerTeam
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $tournamentId = (int) $this->arg('id', '0');

        $tournament = $this->tournaments->findById($tournamentId);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        $body = $this->body();

        // Validate the registration code + that registration is open.
        $code = isset($body['registration_code']) ? trim((string) $body['registration_code']) : '';
        if ($code === '') {
            throw new ValidationException(['registration_code' => 'El código de inscripción es obligatorio.']);
        }
        if ($tournament->registrationCode === null || !hash_equals($tournament->registrationCode, $code)) {
            throw new ForbiddenException('El código de inscripción no es válido para este torneo.');
        }
        if (!$tournament->registrationOpen) {
            throw new ForbiddenException('Las inscripciones están cerradas para este torneo.');
        }

        $teamName = trim((string) ($body['team_name'] ?? ($body['name'] ?? '')));
        if ($teamName === '') {
            throw new ValidationException(['team_name' => 'El nombre del equipo es obligatorio.']);
        }

        // Roster: at least one player, each with cédula + nombre completo.
        $rawPlayers = is_array($body['players'] ?? null) ? array_values($body['players']) : [];
        if (count($rawPlayers) < 1) {
            throw new ValidationException(['players' => 'Debes inscribir al menos un jugador.']);
        }

        $players = [];
        foreach ($rawPlayers as $index => $p) {
            if (!is_array($p)) {
                throw new ValidationException(["players.$index" => 'Jugador inválido.']);
            }
            $documentId = isset($p['document_id']) ? trim((string) $p['document_id']) : '';
            if ($documentId === '') {
                throw new ValidationException(["players.$index.document_id" => 'La cédula del jugador es obligatoria.']);
            }
            $fullName = isset($p['full_name']) ? trim((string) $p['full_name']) : '';
            if ($fullName === '') {
                throw new ValidationException(["players.$index.full_name" => 'El nombre del jugador es obligatorio.']);
            }

            $players[] = [
                'document_id'  => $documentId,
                'full_name'    => $fullName,
                'alias'        => isset($p['alias']) && trim((string) $p['alias']) !== '' ? trim((string) $p['alias']) : null,
                'birthdate'    => isset($p['birthdate']) && $p['birthdate'] !== '' ? (string) $p['birthdate'] : null,
                'photo_url'    => isset($p['photo_url']) && $p['photo_url'] !== '' ? (string) $p['photo_url'] : null,
                'phone'        => isset($p['phone']) && $p['phone'] !== '' ? (string) $p['phone'] : null,
                'shirt_number' => isset($p['shirt_number']) && $p['shirt_number'] !== '' ? (int) $p['shirt_number'] : null,
                'position'     => isset($p['position']) && trim((string) $p['position']) !== '' ? trim((string) $p['position']) : null,
                'is_captain'   => !empty($p['is_captain']),
                'is_delegate'  => !empty($p['is_delegate']),
            ];
        }

        // Late registration flags (effect on fixtures lives in Fase 4).
        $isLate = false;
        $joinedAtRound = null;
        if ($tournament->status === 'in_progress' && $tournament->allowLateRegistration) {
            $isLate = true;
            $joinedAtRound = isset($body['joined_at_round']) && $body['joined_at_round'] !== ''
                ? (int) $body['joined_at_round']
                : null;
        }

        $shortName = isset($body['short_name']) && $body['short_name'] !== '' ? (string) $body['short_name'] : null;
        $coachName = isset($body['coach_name']) && trim((string) $body['coach_name']) !== '' ? trim((string) $body['coach_name']) : null;
        $logoUrl   = isset($body['logo_url']) && $body['logo_url'] !== '' ? (string) $body['logo_url'] : null;

        $registration = $this->registerTeam->execute($tournament, [
            'delegate_user_id' => $user->id,
            'team_name'        => $teamName,
            'short_name'       => $shortName,
            'coach_name'       => $coachName,
            'logo_url'         => $logoUrl,
            'players'          => $players,
            'is_late'          => $isLate,
            'joined_at_round'  => $joinedAtRound,
        ]);

        return $this->responder->created($this->response, $registration);
    }
}
