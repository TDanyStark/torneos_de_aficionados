<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTeamPlayersTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('team_players', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('tournament_team_id', 'integer', ['signed' => false])
            ->addColumn('player_id', 'integer', ['signed' => false])
            ->addColumn('shirt_number', 'integer', [
                'limit'  => \Phinx\Db\Adapter\MysqlAdapter::INT_SMALL,
                'signed' => false,
                'null'   => true,
            ])
            ->addColumn('position', 'string', ['limit' => 40, 'null' => true])
            ->addColumn('is_captain', 'boolean', ['default' => false])
            ->addColumn('is_delegate', 'boolean', ['default' => false])
            ->addColumn('status', 'enum', [
                'values'  => ['active', 'inactive'],
                'default' => 'active',
            ])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            // A player appears at most once per team.
            ->addIndex(['tournament_team_id', 'player_id'], ['unique' => true])
            // Shirt number unique per team (MySQL allows multiple NULLs).
            ->addIndex(['tournament_team_id', 'shirt_number'], ['unique' => true])
            ->addIndex(['player_id'])
            ->addForeignKey('tournament_team_id', 'tournament_teams', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('player_id', 'players', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
