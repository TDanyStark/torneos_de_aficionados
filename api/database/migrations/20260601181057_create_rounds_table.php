<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

/**
 * rounds (jornadas) belong to a stage and optionally to a group (for
 * round-robin within groups). Ordered by `number` ascending (calendar order).
 */
final class CreateRoundsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('rounds', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('stage_id', 'integer', ['signed' => false])
            ->addColumn('group_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('number', 'integer', [
                'limit'  => MysqlAdapter::INT_SMALL,
                'signed' => false,
            ])
            ->addColumn('name', 'string', ['limit' => 80, 'null' => true])
            ->addColumn('scheduled_date', 'date', ['null' => true])
            ->addColumn('status', 'enum', [
                'values'  => ['pending', 'in_progress', 'finished'],
                'default' => 'pending',
            ])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['stage_id', 'group_id', 'number'])
            ->addIndex(['group_id'])
            ->addForeignKey('stage_id', 'stages', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('group_id', 'groups', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
