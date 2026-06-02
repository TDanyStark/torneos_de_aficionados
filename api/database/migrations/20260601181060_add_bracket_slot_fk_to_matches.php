<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Adds the deferred FK matches.bracket_slot_id -> bracket_slots.id now that
 * bracket_slots exists. Resolves the matches <-> bracket_slots circular
 * dependency. ON DELETE SET NULL so a match survives if its slot is removed.
 */
final class AddBracketSlotFkToMatches extends AbstractMigration
{
    public function change(): void
    {
        $this->table('matches')
            ->addForeignKey('bracket_slot_id', 'bracket_slots', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
            ])
            ->update();
    }
}
