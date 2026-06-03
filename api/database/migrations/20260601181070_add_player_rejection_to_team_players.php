<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Individual player moderation: the organizer can reject a single roster entry
 * (with a reason) and later re-accept it. The delegate sees the rejection and
 * the reason on their team management view.
 *
 *   - team_players.status           enum gains 'rejected' (active|inactive|rejected)
 *   - team_players.rejection_reason VARCHAR(255), nullable
 *   - team_players.rejected_at      DATETIME, nullable
 */
final class AddPlayerRejectionToTeamPlayers extends AbstractMigration
{
    public function up(): void
    {
        // Widen the status enum to include 'rejected'.
        $this->table('team_players')
            ->changeColumn('status', 'enum', [
                'values'  => ['active', 'inactive', 'rejected'],
                'default' => 'active',
            ])
            ->addColumn('rejection_reason', 'string', [
                'limit' => 255,
                'null'  => true,
                'after' => 'status',
            ])
            ->addColumn('rejected_at', 'datetime', [
                'null'  => true,
                'after' => 'rejection_reason',
            ])
            ->update();
    }

    public function down(): void
    {
        $this->table('team_players')
            ->removeColumn('rejected_at')
            ->removeColumn('rejection_reason')
            ->changeColumn('status', 'enum', [
                'values'  => ['active', 'inactive'],
                'default' => 'active',
            ])
            ->update();
    }
}
