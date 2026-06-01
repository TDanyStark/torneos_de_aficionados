<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\User\UserRepository;
use App\Infrastructure\Auth\JwtService;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/auth/register
 * Creates a user account and returns a JWT plus the user.
 */
final class RegisterAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private UserRepository $users,
        private JwtService $jwt
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $body = $this->body();

        $name     = trim((string) ($body['name'] ?? ''));
        $email    = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $phone    = isset($body['phone']) ? trim((string) $body['phone']) : null;

        $errors = [];
        if ($name === '') {
            $errors['name'] = 'El nombre es obligatorio.';
        }
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'El correo no es válido.';
        }
        if (strlen($password) < 8) {
            $errors['password'] = 'La contraseña debe tener al menos 8 caracteres.';
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        if ($this->users->emailExists($email)) {
            throw new ValidationException(['email' => 'El correo ya está en uso.']);
        }

        $user = $this->users->create(
            $name,
            $email,
            $phone !== '' ? $phone : null,
            password_hash($password, PASSWORD_ARGON2ID)
        );

        $token = $this->jwt->issue($user);

        return $this->responder->created($this->response, [
            'token'      => $token,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwt->ttl(),
            'user'       => $user,
        ]);
    }
}
