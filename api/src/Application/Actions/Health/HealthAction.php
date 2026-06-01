<?php

declare(strict_types=1);

namespace App\Application\Actions\Health;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Throwable;

/**
 * GET /api/v1/health
 * Public. Verifies database connectivity. Returns 200 when connected,
 * 503 when the database is unreachable.
 */
final class HealthAction extends ApiAction
{
    public function __construct(JsonResponder $responder, private PDO $pdo)
    {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $database = 'connected';
        $healthy = true;

        try {
            $this->pdo->query('SELECT 1');
        } catch (Throwable $e) {
            $database = 'disconnected';
            $healthy = false;
        }

        $payload = [
            'status'    => $healthy ? 'ok' : 'degraded',
            'database'  => $database,
            'timestamp' => date('c'),
        ];

        return $this->responder->success($this->response, $payload, $healthy ? 200 : 503);
    }
}
