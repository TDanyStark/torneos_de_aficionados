<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Fase 9: extends the tournaments table with the new organizer-editable settings
 * and the public logo upload target.
 *
 *   - ends_at                  DATETIME, nullable (placed after starts_at)
 *   - rules                    TEXT, nullable
 *   - prizes                   JSON, nullable (mirrors stages.tiebreakers: stored
 *                              as a json_encode'd map with keys
 *                              first/second/third/others)
 *   - suspension_red_card      BOOLEAN, default 0
 *   - suspension_double_yellow BOOLEAN, default 0
 *   - roster_limit             INT UNSIGNED, nullable (NULL = no limit)
 *   - registration_info        TEXT, nullable
 */
final class AddFase9ColumnsToTournaments extends AbstractMigration
{
    public function change(): void
    {
        $this->table('tournaments')
            ->addColumn('ends_at', 'datetime', ['null' => true, 'after' => 'starts_at'])
            ->addColumn('rules', 'text', ['null' => true])
            ->addColumn('prizes', 'json', ['null' => true])
            ->addColumn('suspension_red_card', 'boolean', ['default' => false])
            ->addColumn('suspension_double_yellow', 'boolean', ['default' => false])
            ->addColumn('roster_limit', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('registration_info', 'text', ['null' => true])
            ->update();
    }
}
