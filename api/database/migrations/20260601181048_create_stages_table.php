<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateStagesTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('stages', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('tournament_id', 'integer', ['signed' => false])
            ->addColumn('name', 'string', ['limit' => 120])
            ->addColumn('type', 'enum', [
                'values' => ['league', 'groups', 'knockout'],
            ])
            ->addColumn('position', 'smallinteger', ['default' => 1])
            ->addColumn('legs', 'integer', ['limit' => \Phinx\Db\Adapter\MysqlAdapter::INT_TINY, 'default' => 1])
            ->addColumn('tiebreakers', 'json', ['null' => true])
            ->addColumn('status', 'enum', [
                'values'  => ['pending', 'in_progress', 'finished'],
                'default' => 'pending',
            ])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['tournament_id', 'position'])
            ->addForeignKey('tournament_id', 'tournaments', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
