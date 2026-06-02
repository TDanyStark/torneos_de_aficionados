<?php

declare(strict_types=1);

namespace App\Application\Actions\Ad;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Application\Service\CreateAdSlotService;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Shared\Exception\ValidationException;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/ad-slots  (admin)
 *
 * Creates a slot AND its auto default creative in one transaction via
 * CreateAdSlotService (NEVER via the repo directly, or the default banner would
 * be missing). Returns 201 with the slot plus its creatives (the new default
 * banner is therefore visible immediately).
 *
 * Body:
 *   - tournament_id ?int   (NULL/absent => global slot)
 *   - placement     string (header|sidebar|between_matches|footer|match_live)
 *   - name          string (non-empty)
 *   - is_active     ?bool  (default true)
 */
final class CreateAdSlotAction extends ApiAction
{
    public const PLACEMENTS = ['header', 'sidebar', 'between_matches', 'footer', 'match_live'];

    public function __construct(
        JsonResponder $responder,
        private CreateAdSlotService $service,
        private AdCreativeRepository $creatives
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        $body = $this->body();
        $errors = [];

        $placement = isset($body['placement']) ? trim((string) $body['placement']) : '';
        if (!in_array($placement, self::PLACEMENTS, true)) {
            $errors['placement'] = 'La posición del slot no es válida.';
        }

        $name = isset($body['name']) ? trim((string) $body['name']) : '';
        if ($name === '') {
            $errors['name'] = 'El nombre del slot es obligatorio.';
        }

        $tournamentId = null;
        if (array_key_exists('tournament_id', $body) && $body['tournament_id'] !== null && $body['tournament_id'] !== '') {
            if (!is_numeric($body['tournament_id'])) {
                $errors['tournament_id'] = 'El torneo no es válido.';
            } else {
                $tournamentId = (int) $body['tournament_id'];
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $slot = $this->service->create([
            'tournament_id' => $tournamentId,
            'placement'     => $placement,
            'name'          => $name,
            'is_active'     => array_key_exists('is_active', $body) ? !empty($body['is_active']) : true,
        ]);

        $payload = array_merge(
            $slot->jsonSerialize(),
            ['creatives' => $this->creatives->findBySlot($slot->id)]
        );

        return $this->responder->created($this->response, $payload);
    }
}
