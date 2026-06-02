<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;
use Phinx\Db\Adapter\MysqlAdapter;

/**
 * match_periods (tiempos / periodos de un partido). A match has N periods
 * (tournaments.periods_count). Each period tracks its own running clock and
 * status so the referee can start/end them independently (Fase 5).
 */
final class CreateMatchPeriodsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('match_periods', [
            'signed'    => false,
            'collation' => 'utf8mb4_unicode_ci',
        ]);

        $table
            ->addColumn('match_id', 'integer', ['signed' => false])
            ->addColumn('number', 'integer', [
                'limit'  => MysqlAdapter::INT_TINY,
                'signed' => false,
            ])
            ->addColumn('status', 'enum', [
                'values'  => ['pending', 'running', 'finished'],
                'default' => 'pending',
            ])
            ->addColumn('started_at', 'datetime', ['null' => true])
            ->addColumn('ended_at', 'datetime', ['null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update'  => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['match_id', 'number'], ['unique' => true])
            ->addForeignKey('match_id', 'matches', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
            ])
            ->create();
    }
}
