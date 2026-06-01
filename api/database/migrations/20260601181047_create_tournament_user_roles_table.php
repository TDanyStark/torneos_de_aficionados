<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTournamentUserRolesTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('tournament_user_roles', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('tournament_id', 'integer', ['signed' => false])
            ->addColumn('user_id', 'integer', ['signed' => false])
            ->addColumn('role', 'enum', [
                'values' => ['organizer', 'referee', 'delegate', 'player'],
            ])
            // team_id is nullable WITHOUT a FK for now; FK added in Phase 3
            // (tournament_teams does not exist yet).
            ->addColumn('team_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['tournament_id', 'user_id', 'role', 'team_id'], ['unique' => true])
            ->addIndex(['user_id'])
            ->addIndex(['tournament_id', 'role'])
            ->addForeignKey('tournament_id', 'tournaments', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
