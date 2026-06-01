<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTournamentsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('tournaments', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('sport_id', 'integer', ['signed' => false])
            ->addColumn('owner_user_id', 'integer', ['signed' => false])
            ->addColumn('name', 'string', ['limit' => 150])
            ->addColumn('slug', 'string', ['limit' => 170])
            ->addColumn('description', 'text', ['null' => true])
            ->addColumn('logo_url', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('status', 'enum', [
                'values'  => ['draft', 'registration', 'in_progress', 'finished', 'archived'],
                'default' => 'draft',
            ])
            ->addColumn('periods_count', 'integer', ['limit' => \Phinx\Db\Adapter\MysqlAdapter::INT_TINY, 'default' => 2])
            ->addColumn('points_win', 'integer', ['limit' => \Phinx\Db\Adapter\MysqlAdapter::INT_TINY, 'default' => 3])
            ->addColumn('points_draw', 'integer', ['limit' => \Phinx\Db\Adapter\MysqlAdapter::INT_TINY, 'default' => 1])
            ->addColumn('points_loss', 'integer', ['limit' => \Phinx\Db\Adapter\MysqlAdapter::INT_TINY, 'default' => 0])
            ->addColumn('allow_late_registration', 'boolean', ['default' => false])
            ->addColumn('registration_open', 'boolean', ['default' => false])
            ->addColumn('registration_code', 'string', ['limit' => 40, 'null' => true])
            ->addColumn('starts_at', 'date', ['null' => true])
            ->addColumn('timezone', 'string', ['limit' => 40, 'default' => 'America/Bogota'])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addColumn('deleted_at', 'timestamp', ['null' => true])
            ->addIndex(['slug'], ['unique' => true])
            ->addIndex(['registration_code'], ['unique' => true])
            ->addIndex(['status'])
            ->addIndex(['owner_user_id'])
            ->addIndex(['updated_at'])
            ->addForeignKey('sport_id', 'sports', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('owner_user_id', 'users', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
