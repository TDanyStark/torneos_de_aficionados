<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Shared\Exception\ApiException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\User\User;
use App\Domain\User\UserRepository;
use App\Infrastructure\Auth\JwtService;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/auth/login
 * Validates credentials and returns a JWT plus the user.
 */
final class LoginAction extends ApiAction
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

        $email    = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        $errors = [];
        if ($email === '') {
            $errors['email'] = 'El correo es obligatorio.';
        }
        if ($password === '') {
            $errors['password'] = 'La contraseña es obligatoria.';
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $row = $this->users->findRowByEmail($email);
        if ($row === null || !password_verify($password, (string) $row['password_hash'])) {
            throw new ApiException('Credenciales incorrectas.', 401);
        }

        $user = User::fromRow($row);
        $token = $this->jwt->issue($user);

        return $this->responder->success($this->response, [
            'token'      => $token,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwt->ttl(),
            'user'       => $user,
        ]);
    }
}
