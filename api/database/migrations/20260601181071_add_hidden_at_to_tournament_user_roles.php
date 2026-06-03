<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Lets a member (organizer/delegate) hide a tournament from their "Torneos que
 * sigo" feed without losing the role or the team. Non-destructive + reversible:
 * `hidden_at` is set per role row; when all of a user's role rows for a
 * tournament are hidden, the tournament drops from their feed by default.
 */
final class AddHiddenAtToTournamentUserRoles extends AbstractMigration
{
    public function change(): void
    {
        $this->table('tournament_user_roles')
            ->addColumn('hidden_at', 'datetime', [
                'null'  => true,
                'after' => 'team_id',
            ])
            ->update();
    }
}
