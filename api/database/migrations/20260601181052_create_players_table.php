<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreatePlayersTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('players', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            // Pool ownership: scoped to the tournament owner (organizer), NOT the
            // requester. Resolved from tournaments.owner_user_id when creating.
            ->addColumn('organizer_user_id', 'integer', ['signed' => false])
            // Optional account link (e.g. a delegate who also plays).
            ->addColumn('user_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('document_id', 'string', ['limit' => 40])
            ->addColumn('full_name', 'string', ['limit' => 150])
            ->addColumn('birthdate', 'date', ['null' => true])
            ->addColumn('photo_url', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('phone', 'string', ['limit' => 40, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            // Identity = cédula, unique per organizer (core of the reuse feature).
            ->addIndex(['organizer_user_id', 'document_id'], ['unique' => true])
            ->addIndex(['organizer_user_id'])
            ->addIndex(['user_id'])
            ->addForeignKey('organizer_user_id', 'users', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
