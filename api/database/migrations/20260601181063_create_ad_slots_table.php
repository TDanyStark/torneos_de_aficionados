<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * ad_slots (publicidad): a fixed ad position in the UI. A slot can be GLOBAL
 * (tournament_id NULL) or per-tournament. Each slot serves a creative resolved
 * at read time (see App\Domain\Ad\CreativeResolver). When a slot is created the
 * application transactionally inserts its default "espacio disponible" creative
 * (see CreateAdSlotService).
 *
 * tournament_id is a NULLABLE FK (mirrors AddTeamFkToTournamentUserRoles): NULL
 * means the slot is global. ON DELETE CASCADE so per-tournament slots disappear
 * with their tournament.
 */
final class CreateAdSlotsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('ad_slots', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('tournament_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('placement', 'enum', [
                'values' => [
                    'header',
                    'sidebar',
                    'between_matches',
                    'footer',
                    'match_live',
                ],
            ])
            ->addColumn('name', 'string', ['limit' => 80])
            ->addColumn('is_active', 'boolean', ['default' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['tournament_id', 'placement'])
            ->addForeignKey('tournament_id', 'tournaments', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
