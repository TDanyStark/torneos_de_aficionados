<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateGroupTeamsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('group_teams', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('group_id', 'integer', ['signed' => false])
            ->addColumn('tournament_team_id', 'integer', ['signed' => false])
            ->addColumn('seed', 'integer', [
                'limit'  => \Phinx\Db\Adapter\MysqlAdapter::INT_SMALL,
                'signed' => false,
                'null'   => true,
            ])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['group_id', 'tournament_team_id'], ['unique' => true])
            ->addIndex(['tournament_team_id'])
            ->addForeignKey('group_id', 'groups', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('tournament_team_id', 'tournament_teams', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
