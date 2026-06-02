<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Fase 12: adds an optional bracket_size to stages so a knockout stage can be
 * created by fixed size (4/8/16/32/64/128) instead of being derived only from
 * feeder groups.
 *
 *   - bracket_size  SMALLINT UNSIGNED, nullable (placed after legs). NULL keeps
 *                   the legacy group_teams-derived knockout behavior.
 */
final class AddBracketSizeToStages extends AbstractMigration
{
    public function change(): void
    {
        $this->table('stages')
            ->addColumn('bracket_size', 'smallinteger', [
                'signed' => false,
                'null'   => true,
                'after'  => 'legs',
            ])
            ->update();
    }
}
