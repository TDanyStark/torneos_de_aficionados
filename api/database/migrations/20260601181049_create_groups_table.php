<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateGroupsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('groups', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('stage_id', 'integer', ['signed' => false])
            ->addColumn('name', 'string', ['limit' => 80])
            ->addColumn('position', 'smallinteger', ['default' => 1])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['stage_id', 'position'])
            ->addForeignKey('stage_id', 'stages', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
