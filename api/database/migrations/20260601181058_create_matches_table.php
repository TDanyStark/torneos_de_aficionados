<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

/**
 * matches (partidos). Score source is home_score/away_score/winner_team_id,
 * consolidated by the sport module when the match finishes (Fase 5).
 *
 * NOTE: bracket_slot_id is created here as a plain nullable INT UNSIGNED column
 * WITHOUT its FK. The FK -> bracket_slots is added in a later migration to break
 * the matches <-> bracket_slots circular dependency.
 */
final class CreateMatchesTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('matches', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('tournament_id', 'integer', ['signed' => false])
            ->addColumn('stage_id', 'integer', ['signed' => false])
            ->addColumn('group_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('round_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('home_team_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('away_team_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('home_score', 'integer', [
                'limit'  => MysqlAdapter::INT_SMALL,
                'signed' => false,
                'null'   => true,
            ])
            ->addColumn('away_score', 'integer', [
                'limit'  => MysqlAdapter::INT_SMALL,
                'signed' => false,
                'null'   => true,
            ])
            ->addColumn('winner_team_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('status', 'enum', [
                'values'  => ['scheduled', 'live', 'paused', 'finished', 'postponed', 'walkover'],
                'default' => 'scheduled',
            ])
            ->addColumn('venue', 'string', ['limit' => 150, 'null' => true])
            ->addColumn('scheduled_at', 'datetime', ['null' => true])
            ->addColumn('started_at', 'datetime', ['null' => true])
            ->addColumn('finished_at', 'datetime', ['null' => true])
            ->addColumn('referee_user_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('leg', 'integer', [
                'limit'   => MysqlAdapter::INT_TINY,
                'signed'  => false,
                'default' => 1,
            ])
            // FK to bracket_slots added later (circular dependency).
            ->addColumn('bracket_slot_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['round_id'])
            ->addIndex(['stage_id', 'group_id'])
            ->addIndex(['status'])
            ->addIndex(['tournament_id', 'status'])
            ->addIndex(['home_team_id'])
            ->addIndex(['away_team_id'])
            ->addIndex(['referee_user_id'])
            ->addIndex(['updated_at'])
            ->addForeignKey('tournament_id', 'tournaments', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('stage_id', 'stages', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('group_id', 'groups', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('round_id', 'rounds', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('home_team_id', 'tournament_teams', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('away_team_id', 'tournament_teams', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('winner_team_id', 'tournament_teams', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('referee_user_id', 'users', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
