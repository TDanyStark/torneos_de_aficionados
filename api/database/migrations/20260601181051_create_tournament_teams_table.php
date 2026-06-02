<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTournamentTeamsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('tournament_teams', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('tournament_id', 'integer', ['signed' => false])
            ->addColumn('name', 'string', ['limit' => 120])
            ->addColumn('short_name', 'string', ['limit' => 20, 'null' => true])
            ->addColumn('logo_url', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('delegate_user_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('status', 'enum', [
                'values'  => ['pending', 'approved', 'rejected', 'withdrawn'],
                'default' => 'pending',
            ])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addColumn('deleted_at', 'timestamp', ['null' => true])
            ->addIndex(['tournament_id', 'status'])
            ->addIndex(['delegate_user_id'])
            ->addIndex(['updated_at'])
            ->addForeignKey('tournament_id', 'tournaments', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('delegate_user_id', 'users', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
