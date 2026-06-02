<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

/**
 * bracket_slots model a knockout bracket. home_source/away_source encode where
 * each side comes from ('group:{id}#N', 'winner:slot:{id}'). next_slot_id is a
 * self-FK linking a slot to the slot the winner advances to. match_id binds the
 * slot to its played match once teams are resolved.
 */
final class CreateBracketSlotsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('bracket_slots', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('stage_id', 'integer', ['signed' => false])
            ->addColumn('round_number', 'integer', [
                'limit'  => MysqlAdapter::INT_SMALL,
                'signed' => false,
            ])
            ->addColumn('round_label', 'string', ['limit' => 60, 'null' => true])
            ->addColumn('position', 'integer', [
                'limit'  => MysqlAdapter::INT_SMALL,
                'signed' => false,
            ])
            ->addColumn('home_source', 'string', ['limit' => 60, 'null' => true])
            ->addColumn('away_source', 'string', ['limit' => 60, 'null' => true])
            ->addColumn('next_slot_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('match_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['stage_id', 'round_number'])
            ->addIndex(['next_slot_id'])
            ->addIndex(['match_id'])
            ->addForeignKey('stage_id', 'stages', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('next_slot_id', 'bracket_slots', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('match_id', 'matches', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
