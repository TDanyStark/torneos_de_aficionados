<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

/**
 * match_events (eventos del partido): goals, own goals, cards and period
 * markers recorded live by the referee. Live score and tournament stats
 * (top scorers, discipline) are DERIVED from these rows — there are no
 * separate stats tables.
 *
 * NOTE: player_id -> players.id (NOT team_players). This matches the existing
 * PdoPlayerRepository::historyForOrganizer() which joins
 * `match_events me ON me.player_id = tp.player_id`. SET_NULL on player/team so
 * roster cleanup keeps historical events.
 */
final class CreateMatchEventsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('match_events', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('match_id', 'integer', ['signed' => false])
            ->addColumn('match_period_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('type', 'enum', [
                'values' => [
                    'goal',
                    'own_goal',
                    'yellow_card',
                    'red_card',
                    'period_start',
                    'period_end',
                ],
            ])
            ->addColumn('team_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('player_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('minute', 'integer', [
                'limit'  => MysqlAdapter::INT_SMALL,
                'signed' => false,
                'null'   => true,
            ])
            ->addColumn('created_by_user_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['match_id', 'id'])
            ->addIndex(['player_id', 'type'])
            ->addIndex(['team_id'])
            ->addForeignKey('match_id', 'matches', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('match_period_id', 'match_periods', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('team_id', 'tournament_teams', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('player_id', 'players', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->addForeignKey('created_by_user_id', 'users', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
