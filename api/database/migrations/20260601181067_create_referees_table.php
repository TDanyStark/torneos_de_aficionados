<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Fase 13: per-tournament referees directory (NAME ONLY, no user account).
 *
 *   - referees           a tournament-scoped catalogue of referee names. Many
 *                        per tournament. ON DELETE CASCADE with its tournament.
 *   - matches.referee_id NEW nullable FK -> referees.id (the name printed on the
 *                        match sheet). DISTINCT from referee_user_id, which is
 *                        the user account that controls the live match. ON
 *                        DELETE SET NULL so deleting a referee clears the sheet
 *                        reference without touching the match.
 */
final class CreateRefereesTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('referees', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('tournament_id', 'integer', ['signed' => false])
            ->addColumn('name', 'string', ['limit' => 120])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['tournament_id'])
            ->addForeignKey('tournament_id', 'tournaments', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();

        // Add the match-sheet referee FK now that `referees` exists. Placed
        // next to referee_user_id; ON DELETE SET NULL keeps the match alive.
        $this->table('matches')
            ->addColumn('referee_id', 'integer', [
                'signed' => false,
                'null'   => true,
                'after'  => 'referee_user_id',
            ])
            ->addIndex(['referee_id'])
            ->addForeignKey('referee_id', 'referees', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->update();
    }
}
