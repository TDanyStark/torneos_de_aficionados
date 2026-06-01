<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSportsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('sports', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('module_key', 'string', ['limit' => 60])
            ->addColumn('name', 'string', ['limit' => 80])
            ->addColumn('slug', 'string', ['limit' => 80])
            ->addColumn('variant', 'string', ['limit' => 40, 'null' => true])
            ->addColumn('players_per_side', 'smallinteger', ['null' => true])
            ->addColumn('default_config', 'json', ['null' => true])
            ->addColumn('is_active', 'boolean', ['default' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['slug'], ['unique' => true])
            ->addIndex(['module_key'])
            ->create();
    }
}
