<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * ad_creatives (publicidad): the content shown in a slot. Image or video with
 * an optional CTA. Each slot has exactly one is_default=1 creative (the "espacio
 * disponible -> WhatsApp" banner created with the slot). Sellable creatives have
 * is_default=0 and optional vigencia (starts_at/ends_at). The CreativeResolver
 * picks the served creative per slot: most-recent active sellable in window, else
 * the default banner.
 *
 * ON DELETE CASCADE so creatives vanish with their slot.
 */
final class CreateAdCreativesTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('ad_creatives', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('ad_slot_id', 'integer', ['signed' => false])
            ->addColumn('media_type', 'enum', ['values' => ['image', 'video']])
            ->addColumn('media_url', 'string', ['limit' => 255])
            ->addColumn('cta_url', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('cta_label', 'string', ['limit' => 80, 'null' => true])
            ->addColumn('is_default', 'boolean', ['default' => false])
            ->addColumn('is_active', 'boolean', ['default' => true])
            ->addColumn('starts_at', 'datetime', ['null' => true])
            ->addColumn('ends_at', 'datetime', ['null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['ad_slot_id', 'is_active'])
            ->addForeignKey('ad_slot_id', 'ad_slots', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
