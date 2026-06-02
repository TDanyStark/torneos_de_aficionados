<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateRegistrationsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('registrations', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('tournament_id', 'integer', ['signed' => false])
            ->addColumn('tournament_team_id', 'integer', ['signed' => false])
            ->addColumn('channel', 'enum', [
                'values' => ['manual', 'self_link'],
            ])
            ->addColumn('status', 'enum', [
                'values'  => ['submitted', 'pending', 'approved', 'rejected'],
                'default' => 'pending',
            ])
            ->addColumn('is_late', 'boolean', ['default' => false])
            ->addColumn('joined_at_round', 'integer', [
                'limit'  => \Phinx\Db\Adapter\MysqlAdapter::INT_SMALL,
                'signed' => false,
                'null'   => true,
            ])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['tournament_id', 'status'])
            ->addIndex(['tournament_team_id'])
            ->addIndex(['updated_at'])
            ->addForeignKey('tournament_id', 'tournaments', 'id', [
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
