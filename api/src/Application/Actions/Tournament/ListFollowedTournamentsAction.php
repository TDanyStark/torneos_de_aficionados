<?php

declare(strict_types=1);

namespace App\Application\Actions\Tournament;

use App\Application\Action\ApiAction;
use App\Application\Responder\JsonResponder;
use App\Domain\Role\TournamentUserRoleRepository;
use App\Domain\Tournament\TournamentRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * GET /api/v1/me/tournaments  (authenticated)
 *
 * Backs the "Torneos que sigo" view for logged-in users: every tournament where
 * the user holds an organizer or delegate role, deduped, newest first. Each
 * tournament is annotated with `my_roles` (the role values the user holds in
 * that tournament) so the UI can render a relationship badge.
 *
 * Followed-as-visitor/player tournaments are tracked client-side in
 * localStorage and merged by the frontend; they are NOT returned here.
 *
 * Query: ?include_hidden=1 returns ONLY the tournaments the user has hidden
 * (the "Ver ocultos" view). Default omits hidden tournaments.
 *
 * Response 200: [ { ...tournament, my_roles: ["organizer"|"delegate", ...] } ]
 */
final class ListFollowedTournamentsAction extends ApiAction
{
    /** Roles that make a tournament appear under "Torneos que sigo". */
    private const MEMBER_ROLES = ['organizer', 'delegate'];

    public function __construct(
        JsonResponder $responder,
        private TournamentRepository $tournaments,
        private TournamentUserRoleRepository $roles
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $params = $this->request->getQueryParams();
        $includeHidden = isset($params['include_hidden'])
            && in_array((string) $params['include_hidden'], ['1', 'true'], true);

        $tournaments = $this->tournaments->findByMemberRoles(
            $user->id,
            self::MEMBER_ROLES,
            $includeHidden,
        );

        // Build a tournament_id -> distinct role values map for the user.
        $roleRows = $this->roles->findByUser($user->id);
        $rolesByTournament = [];
        foreach ($roleRows as $row) {
            if (!in_array($row->role, self::MEMBER_ROLES, true)) {
                continue;
            }
            $rolesByTournament[$row->tournamentId][$row->role] = true;
        }

        $items = array_map(
            static function ($tournament) use ($rolesByTournament): array {
                $data = $tournament->jsonSerialize();
                $data['my_roles'] = array_keys($rolesByTournament[$tournament->id] ?? []);

                return $data;
            },
            $tournaments
        );

        return $this->responder->success($this->response, $items);
    }
}
