<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Adds the deferred FK on tournament_user_roles.team_id now that
 * tournament_teams exists. The column already exists (nullable INT UNSIGNED).
 * ON DELETE SET NULL so a role row survives if its team is removed.
 */
final class AddTeamFkToTournamentUserRoles extends AbstractMigration
{
    public function change(): void
    {
        $this->table('tournament_user_roles')
            ->addForeignKey('team_id', 'tournament_teams', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->update();
    }
}
