<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Adds `is_filed` (boolean, default false) to tournaments.
 *
 * This is an ARCHIVE flag, independent of the `status` lifecycle. An organizer
 * can archive a tournament from their dashboard to declutter the active list
 * without changing its status; archived tournaments are shown under a separate
 * "Archivados" view (filtered by URL). Restoring simply clears the flag.
 *
 * Distinct from `tournament_user_roles.hidden_at` (per-user feed hiding) and
 * from `tournaments.deleted_at` (soft-delete). Indexed for the dashboard filter.
 */
final class AddIsFiledToTournaments extends AbstractMigration
{
    public function up(): void
    {
        $this->table('tournaments')
            ->addColumn('is_filed', 'boolean', [
                'default' => false,
                'after'   => 'is_public',
            ])
            ->addIndex(['is_filed'])
            ->update();
    }

    public function down(): void
    {
        $this->table('tournaments')
            ->removeIndex(['is_filed'])
            ->removeColumn('is_filed')
            ->update();
    }
}
