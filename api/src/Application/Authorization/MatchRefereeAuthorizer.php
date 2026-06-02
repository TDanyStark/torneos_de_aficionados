<?php

declare(strict_types=1);

namespace App\Application\Authorization;

use App\Domain\Fixture\Match_;
use App\Domain\Shared\Exception\ForbiddenException;
use App\Domain\User\User;

/**
 * Authorizes referee-only match actions (start/end period, record/delete event,
 * finish match). A user passes when ANY of the following holds:
 *   - the user is a global admin, OR
 *   - the user is the match's designated referee (matches.referee_user_id), OR
 *   - the user holds the 'organizer' role in the match's tournament.
 *
 * Reuses TournamentAuthorizer for the organizer check so role resolution stays
 * centralized. The match {id} route arg can't be guarded by RoleMiddleware (it
 * is the match id, not the tournament id), so actions call assert() inline.
 */
final class MatchRefereeAuthorizer
{
    public function __construct(private TournamentAuthorizer $tournamentAuthorizer)
    {
    }

    /**
     * Throws ForbiddenException unless the user may control the given match.
     */
    public function assert(User $user, Match_ $match): void
    {
        if ($user->isAdmin) {
            return;
        }

        if ($match->refereeUserId !== null && $match->refereeUserId === $user->id) {
            return;
        }

        // Organizer of the tournament may also control the match. Delegates
        // TournamentAuthorizer's ForbiddenException when the user lacks the role.
        $this->tournamentAuthorizer->assert($user, $match->tournamentId, ['organizer']);
    }
}
