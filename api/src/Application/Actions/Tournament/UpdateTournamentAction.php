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
        if (array_key_exists('timezone', $body)) {
            $tz = trim((string) $body['timezone']);
            if ($tz !== '') {
                $data['timezone'] = $tz;
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
}
