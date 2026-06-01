<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateUsersTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('users', [
            'signed'     => false,
            'collation'  => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('name', 'string', ['limit' => 120])
            ->addColumn('email', 'string', ['limit' => 160])
            ->addColumn('phone', 'string', ['limit' => 30, 'null' => true])
            ->addColumn('password_hash', 'string', ['limit' => 255])
            ->addColumn('is_admin', 'boolean', ['default' => false])
            ->addColumn('avatar_url', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('email_verified_at', 'timestamp', ['null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addColumn('deleted_at', 'timestamp', ['null' => true])
            ->addIndex(['email'], ['unique' => true])
            ->addIndex(['is_admin'])
            ->create();
    }
}
