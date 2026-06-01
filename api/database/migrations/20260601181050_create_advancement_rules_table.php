<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateAdvancementRulesTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('advancement_rules', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('stage_id', 'integer', ['signed' => false])
            ->addColumn('group_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('qualifies_count', 'smallinteger', ['null' => true])
            ->addColumn('eliminates_count', 'smallinteger', ['null' => true])
            ->addColumn('target_stage_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['stage_id'])
            ->addIndex(['group_id'])
            ->addForeignKey('stage_id', 'stages', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('group_id', 'groups', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('target_stage_id', 'stages', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
