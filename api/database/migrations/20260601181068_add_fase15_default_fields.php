<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Fase 15: adds the two default registration fields requested by organizers.
 *
 *   - tournament_teams.coach_name  VARCHAR(120), nullable (placed after short_name)
 *   - players.alias                VARCHAR(60),  nullable (placed after full_name)
 *
 * No custom-field builder is introduced: these stay plain columns so the
 * existing array-data-bag flow (CreateTeamAction / AddPlayerToTeamAction /
 * RegisterTeamService) keeps working unchanged. roster_limit / registration_info
 * already exist from Fase 9 (20260601181065) and are untouched here.
 */
final class AddFase15DefaultFields extends AbstractMigration
{
    public function change(): void
    {
        $this->table('tournament_teams')
            ->addColumn('coach_name', 'string', [
                'limit' => 120,
                'null'  => true,
                'after' => 'short_name',
            ])
            ->update();

        $this->table('players')
            ->addColumn('alias', 'string', [
                'limit' => 60,
                'null'  => true,
                'after' => 'full_name',
            ])
            ->update();
    }
}
