<?php

declare(strict_types=1);

namespace App\Application\Service;

use App\Application\Settings\SettingsInterface;
use App\Domain\Ad\AdCreativeRepository;
use App\Domain\Ad\AdSlot;
use App\Domain\Ad\AdSlotRepository;
use PDO;

/**
 * Transaction coordinator for ad slot creation. Mirrors RegisterTeamService:
 * injects the shared PDO singleton plus the repositories and wraps the
 * multi-table insert (slot + its default "espacio disponible" creative) in a
 * single transaction.
 *
 * Every slot is born with exactly one is_default=1 creative whose CTA points to
 * the admin's WhatsApp (ADMIN_WHATSAPP). The frontend renders AdDefaultBanner
 * whenever the served creative has is_default=1.
 */
final class CreateAdSlotService
{
    /**
     * Default creative copy shown until a real ad is sold.
     */
    public const DEFAULT_CTA_LABEL = 'Este espacio está disponible';

    /**
     * Sentinel media_url for the default banner. The frontend ignores it and
     * renders AdDefaultBanner based on is_default=1, so no real asset is needed.
     */
    public const DEFAULT_MEDIA_URL = '';

    public function __construct(
        private PDO $pdo,
        private AdSlotRepository $slots,
        private AdCreativeRepository $creatives,
        private SettingsInterface $settings
    ) {
    }

    /**
     * @param array<string,mixed> $slotData
     *   - tournament_id ?int   (NULL => global slot)
     *   - placement     string (header|sidebar|between_matches|footer|match_live)
     *   - name          string
     *   - is_active     ?bool  (default true)
     */
    public function create(array $slotData): AdSlot
    {
        $this->pdo->beginTransaction();

        try {
            $slot = $this->slots->create([
                'tournament_id' => $slotData['tournament_id'] ?? null,
                'placement'     => $slotData['placement'],
                'name'          => $slotData['name'],
                'is_active'     => array_key_exists('is_active', $slotData)
                    ? !empty($slotData['is_active'])
                    : true,
            ]);

            $this->creatives->create([
                'ad_slot_id' => $slot->id,
                'media_type' => 'image',
                'media_url'  => self::DEFAULT_MEDIA_URL,
                'cta_url'    => $this->whatsAppUrl(),
                'cta_label'  => self::DEFAULT_CTA_LABEL,
                'is_default' => true,
                'is_active'  => true,
                'starts_at'  => null,
                'ends_at'    => null,
            ]);

            $this->pdo->commit();

            return $slot;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Builds the WhatsApp CTA URL from the configured ADMIN_WHATSAPP value.
     *
     * Format produced:
     *   - empty config            -> ''  (frontend hides the CTA / falls back)
     *   - already a URL (http/https/wa.me/api.whatsapp) -> returned verbatim
     *   - anything else           -> 'https://wa.me/{digits}' with all
     *                                non-digit characters stripped
     *     e.g. '+57 300 000 0000' -> 'https://wa.me/573000000000'
     */
    public function whatsAppUrl(): string
    {
        $raw = trim((string) $this->settings->get('adminWhatsapp'));

        if ($raw === '') {
            return '';
        }

        if (preg_match('#^https?://#i', $raw) === 1) {
            return $raw;
        }

        $digits = preg_replace('/\D+/', '', $raw) ?? '';
        if ($digits === '') {
            return '';
        }

        return 'https://wa.me/' . $digits;
    }
}
