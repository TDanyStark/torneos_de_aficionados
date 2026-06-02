<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Shared\Slug;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * PUT /api/v1/tournaments/{id}  (organizer OWNER only)
 * Updates editable tournament settings. Opening registration generates a unique
 * registration_code; closing it clears the code.
 */
final class UpdateTournamentAction extends ApiAction
{
    private const STATUSES = ['draft', 'registration', 'in_progress', 'finished', 'archived'];

    private const ROSTER_LIMIT_MIN = 5;
    private const ROSTER_LIMIT_MAX = 100;

    /** Allowed keys inside the prizes object. */
    private const PRIZE_KEYS = ['first', 'second', 'third', 'others'];

    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $id = (int) $this->arg('id', '0');

        $tournament = $this->tournaments->findById($id);
        if ($tournament === null) {
            throw new NotFoundException('Torneo no encontrado.');
        }

        if (!$user->isAdmin && $tournament->ownerUserId !== $user->id) {
            throw new ForbiddenException('Solo el organizador propietario puede editar este torneo.');
        }

        $body = $this->body();
        $data = [];
        $errors = [];

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if ($name === '') {
                $errors['name'] = 'El nombre del torneo es obligatorio.';
            } else {
                $data['name'] = $name;
            }
        }
        if (array_key_exists('description', $body)) {
            $description = trim((string) $body['description']);
            $data['description'] = $description !== '' ? $description : null;
        }
        if (array_key_exists('logo_url', $body)) {
            $logoUrl = trim((string) $body['logo_url']);
            $data['logo_url'] = $logoUrl !== '' ? $logoUrl : null;
        }
        if (array_key_exists('status', $body)) {
            $status = (string) $body['status'];
            if (!in_array($status, self::STATUSES, true)) {
                $errors['status'] = 'El estado del torneo no es válido.';
            } else {
                $data['status'] = $status;
            }
        }
        if (array_key_exists('periods_count', $body)) {
            $data['periods_count'] = max(1, (int) $body['periods_count']);
        }
        foreach (['points_win', 'points_draw', 'points_loss'] as $pf) {
            if (array_key_exists($pf, $body)) {
                $data[$pf] = max(0, (int) $body[$pf]);
            }
        }
        if (array_key_exists('allow_late_registration', $body)) {
            $data['allow_late_registration'] = !empty($body['allow_late_registration']);
        }
        if (array_key_exists('starts_at', $body)) {
            $startsAt = (string) $body['starts_at'];
            if ($startsAt === '') {
                $data['starts_at'] = null;
            } elseif (!$this->isValidDate($startsAt)) {
                $errors['starts_at'] = 'La fecha de inicio no es válida (formato YYYY-MM-DD).';
            } else {
                $data['starts_at'] = $startsAt;
            }
        }
        if (array_key_exists('ends_at', $body)) {
            $endsAt = trim((string) $body['ends_at']);
            if ($endsAt === '') {
                $data['ends_at'] = null;
            } else {
                $normalized = $this->normalizeDateTime($endsAt);
                if ($normalized === null) {
                    $errors['ends_at'] =
                        'La fecha de finalización no es válida (formato YYYY-MM-DD o YYYY-MM-DD HH:MM:SS).';
                } else {
                    $data['ends_at'] = $normalized;
                }
            }
        }
        if (array_key_exists('timezone', $body)) {
            $tz = trim((string) $body['timezone']);
            if ($tz !== '') {
                $data['timezone'] = $tz;
            }
        }
        if (array_key_exists('rules', $body)) {
            $rules = trim((string) $body['rules']);
            $data['rules'] = $rules !== '' ? $rules : null;
        }
        if (array_key_exists('registration_info', $body)) {
            $registrationInfo = trim((string) $body['registration_info']);
            $data['registration_info'] = $registrationInfo !== '' ? $registrationInfo : null;
        }
        if (array_key_exists('suspension_red_card', $body)) {
            $data['suspension_red_card'] = !empty($body['suspension_red_card']);
        }
        if (array_key_exists('suspension_double_yellow', $body)) {
            $data['suspension_double_yellow'] = !empty($body['suspension_double_yellow']);
        }
        if (array_key_exists('roster_limit', $body)) {
            $rosterLimit = $body['roster_limit'];
            if ($rosterLimit === null || $rosterLimit === '') {
                $data['roster_limit'] = null;
            } else {
                $limit = (int) $rosterLimit;
                if ($limit < self::ROSTER_LIMIT_MIN || $limit > self::ROSTER_LIMIT_MAX) {
                    $errors['roster_limit'] = sprintf(
                        'El límite de jugadores debe estar entre %d y %d.',
                        self::ROSTER_LIMIT_MIN,
                        self::ROSTER_LIMIT_MAX
                    );
                } else {
                    $data['roster_limit'] = $limit;
                }
            }
        }
        if (array_key_exists('prizes', $body)) {
            $prizes = $body['prizes'];
            if ($prizes === null || $prizes === '' || $prizes === []) {
                $data['prizes'] = null;
            } elseif (!is_array($prizes)) {
                $errors['prizes'] = 'Los premios deben ser un objeto con claves first, second, third u others.';
            } else {
                $clean = [];
                foreach (self::PRIZE_KEYS as $key) {
                    if (array_key_exists($key, $prizes)) {
                        $value = trim((string) $prizes[$key]);
                        if ($value !== '') {
                            $clean[$key] = $value;
                        }
                    }
                }
                $data['prizes'] = $clean !== [] ? $clean : null;
            }
        }

        // Registration toggle: opening generates a unique code, closing clears it.
        if (array_key_exists('registration_open', $body)) {
            $open = !empty($body['registration_open']);
            $data['registration_open'] = $open;

            if ($open && $tournament->registrationCode === null) {
                $data['registration_code'] = $this->uniqueRegistrationCode();
            } elseif (!$open) {
                $data['registration_code'] = null;
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $updated = $this->tournaments->update($id, $data);

        return $this->responder->success($this->response, $updated);
    }

    private function uniqueRegistrationCode(): string
    {
        do {
            $code = Slug::code(8);
        } while ($this->tournaments->registrationCodeExists($code));

        return $code;
    }

    private function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);

        return $d !== false && $d->format('Y-m-d') === $date;
    }

    /**
     * Accepts a date (YYYY-MM-DD) or a datetime (YYYY-MM-DD HH:MM:SS) and returns
     * a normalized DATETIME string (YYYY-MM-DD HH:MM:SS), or null when invalid.
     */
    private function normalizeDateTime(string $value): ?string
    {
        $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $value);
        if ($dt !== false && $dt->format('Y-m-d H:i:s') === $value) {
            return $value;
        }

        $d = \DateTime::createFromFormat('Y-m-d', $value);
        if ($d !== false && $d->format('Y-m-d') === $value) {
            return $value . ' 00:00:00';
        }

        return null;
    }
}
