<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Fase 17 — tournament visibility + lifecycle simplification.
 *
 * 1. Adds `is_public` (boolean, default false): tournaments are PRIVATE by
 *    default and only reachable via their shareable link. The public `/torneos`
 *    listing shows only `is_public = 1` tournaments.
 * 2. Drops the `draft` status. New lifecycle = registration → in_progress →
 *    finished → archived, defaulting to `registration` (registrations open by
 *    default). Existing `draft` rows are migrated to `registration`.
 * 3. Flips the `registration_open` default to TRUE (open by default).
 */
final class AddVisibilityAndDropDraftToTournaments extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('tournaments');

        // 1. Visibility flag — private by default.
        $table
            ->addColumn('is_public', 'boolean', [
                'default' => false,
                'after'   => 'status',
            ])
            ->addIndex(['is_public'])
            ->update();

        // 2. Migrate existing draft rows to registration BEFORE narrowing the enum.
        $this->execute("UPDATE tournaments SET status = 'registration' WHERE status = 'draft'");

        // 3. Narrow the status enum (drop 'draft') and default to 'registration'.
        $table
            ->changeColumn('status', 'enum', [
                'values'  => ['registration', 'in_progress', 'finished', 'archived'],
                'default' => 'registration',
            ])
            // 4. Open registrations by default for newly created tournaments.
            ->changeColumn('registration_open', 'boolean', ['default' => true])
            ->update();
    }

    public function down(): void
    {
        $table = $this->table('tournaments');

        $table
            ->changeColumn('status', 'enum', [
                'values'  => ['draft', 'registration', 'in_progress', 'finished', 'archived'],
                'default' => 'draft',
            ])
            ->changeColumn('registration_open', 'boolean', ['default' => false])
            ->removeIndex(['is_public'])
            ->removeColumn('is_public')
            ->update();
    }
}
