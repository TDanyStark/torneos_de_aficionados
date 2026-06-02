<?php

declare(strict_types=1);

use App\Application\Actions\Ad\CreateAdCreativeAction;
use App\Application\Actions\Ad\CreateAdSlotAction;
use App\Application\Actions\Ad\DeleteAdCreativeAction;
use App\Application\Actions\Ad\DeleteAdSlotAction;
use App\Application\Actions\Ad\ListAdSlotsAction;
use App\Application\Actions\Ad\ListTournamentAdSlotsAction;
use App\Application\Actions\Ad\PublicAdsAction;
use App\Application\Actions\Ad\TournamentAdsAction;
use App\Application\Actions\Ad\UpdateAdCreativeAction;
use App\Application\Actions\Ad\UpdateAdSlotAction;
use App\Application\Actions\Ad\UploadCreativeMediaAction;
use App\Application\Actions\AdvancementRule\CreateAdvancementRuleAction;
use App\Application\Actions\AdvancementRule\DeleteAdvancementRuleAction;
use App\Application\Actions\AdvancementRule\ListAdvancementRulesAction;
use App\Application\Actions\AdvancementRule\UpdateAdvancementRuleAction;
use App\Application\Actions\Auth\LoginAction;
use App\Application\Actions\Auth\MeAction;
use App\Application\Actions\Auth\RegisterAction;
use App\Application\Actions\Fixture\CreateMatchAction;
use App\Application\Actions\Fixture\CreateRoundAction;
use App\Application\Actions\Fixture\DeleteMatchAction;
use App\Application\Actions\Fixture\DeleteRoundAction;
use App\Application\Actions\Fixture\GenerateFixturesAction;
use App\Application\Actions\Fixture\GroupStandingsAction;
use App\Application\Actions\Fixture\ListMatchesAction;
use App\Application\Actions\Fixture\ListRoundsAction;
use App\Application\Actions\Fixture\RegenerateFixturesAction;
use App\Application\Actions\Fixture\UpdateMatchAction;
use App\Application\Actions\Fixture\UpdateRoundAction;
use App\Application\Actions\Group\CreateGroupAction;
use App\Application\Actions\Group\DistributeGroupsAction;
use App\Application\Actions\Live\CardsAction;
use App\Application\Actions\Live\DeleteEventAction;
use App\Application\Actions\Live\EndPeriodAction;
use App\Application\Actions\Live\FinishMatchAction;
use App\Application\Actions\Live\LiveMatchAction;
use App\Application\Actions\Live\RecordEventAction;
use App\Application\Actions\Live\StartPeriodAction;
use App\Application\Actions\Live\TopScorersAction;
use App\Application\Actions\Group\DeleteGroupAction;
use App\Application\Actions\Group\ListGroupsAction;
use App\Application\Actions\Group\UpdateGroupAction;
use App\Application\Actions\GroupTeam\AssignTeamToGroupAction;
use App\Application\Actions\GroupTeam\ListGroupTeamsAction;
use App\Application\Actions\GroupTeam\RemoveTeamFromGroupAction;
use App\Application\Actions\Health\HealthAction;
use App\Application\Actions\Player\LookupPlayerAction;
use App\Application\Actions\Player\PlayerHistoryAction;
use App\Application\Actions\Referee\AssignMatchRefereeAction;
use App\Application\Actions\Referee\AssignStageRefereeAction;
use App\Application\Actions\Referee\CreateRefereeAction;
use App\Application\Actions\Referee\DeleteRefereeAction;
use App\Application\Actions\Referee\ListRefereesAction;
use App\Application\Actions\Referee\UpdateRefereeAction;
use App\Application\Actions\Registration\CreateRegistrationAction;
use App\Application\Actions\Registration\ListMyRegistrationsAction;
use App\Application\Actions\Registration\ListRegistrationsAction;
use App\Application\Actions\Registration\UpdateRegistrationAction;
use App\Application\Actions\Registration\UploadRegistrationLogoAction;
use App\Application\Actions\Registration\UploadRegistrationPhotoAction;
use App\Application\Actions\Role\CreateTournamentRoleAction;
use App\Application\Actions\Role\DeleteTournamentRoleAction;
use App\Application\Actions\Role\ListTournamentRolesAction;
use App\Application\Actions\Sport\ListSportsAction;
use App\Application\Actions\Stage\CreateStageAction;
use App\Application\Actions\Stage\DeleteStageAction;
use App\Application\Actions\Stage\ListStagesAction;
use App\Application\Actions\Stage\UpdateStageAction;
use App\Application\Actions\Team\CreateTeamAction;
use App\Application\Actions\Team\DeleteTeamAction;
use App\Application\Actions\Team\ListTeamsAction;
use App\Application\Actions\Team\UpdateTeamAction;
use App\Application\Actions\TeamPlayer\AddPlayerToTeamAction;
use App\Application\Actions\TeamPlayer\DeleteTeamPlayerAction;
use App\Application\Actions\TeamPlayer\ListRosterAction;
use App\Application\Actions\TeamPlayer\UpdateTeamPlayerAction;
use App\Application\Actions\Tournament\CreateTournamentAction;
use App\Application\Actions\Tournament\DeleteTournamentAction;
use App\Application\Actions\Tournament\ListMyTournamentsAction;
use App\Application\Actions\Tournament\ListTournamentsAction;
use App\Application\Actions\Tournament\ShowTournamentAction;
use App\Application\Actions\Tournament\ShowTournamentByIdAction;
use App\Application\Actions\Tournament\UpdateTournamentAction;
use App\Application\Actions\Tournament\UploadTournamentLogoAction;
use App\Application\Middleware\AdminMiddleware;
use App\Application\Middleware\JwtAuthMiddleware;
use App\Application\Middleware\RoleMiddlewareFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

return function (App $app) {
    // Per-route role guard factory (resolved once from the container).
    /** @var RoleMiddlewareFactory $roleGuard */
    $roleGuard = $app->getContainer()->get(RoleMiddlewareFactory::class);

    // CORS pre-flight handler.
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });

    $app->get('/', function (Request $request, Response $response) {
        $response->getBody()->write(
            (string) json_encode(['success' => true, 'data' => ['service' => 'torneos-api']])
        );
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    });

    // API v1
    $app->group('/api/v1', function (Group $group) use ($roleGuard) {
        // Health (public)
        $group->get('/health', HealthAction::class);

        // Auth module
        $group->group('/auth', function (Group $auth) {
            $auth->post('/login', LoginAction::class);
            $auth->post('/register', RegisterAction::class);
            $auth->get('/me', MeAction::class)->add(JwtAuthMiddleware::class);
        });

        // Current-user read models. "Mis inscripciones": tournaments where the
        // user is a team delegate, with status. Roles are per-tournament, so this
        // is independent of organizer/referee/player roles elsewhere.
        $group->group('/me', function (Group $me) {
            $me->get('/registrations', ListMyRegistrationsAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Sports module (public catalog)
        $group->group('/sports', function (Group $sports) {
            $sports->get('', ListSportsAction::class);
        });

        // Tournaments module
        $group->group('/tournaments', function (Group $tournaments) use ($roleGuard) {
            // Public
            $tournaments->get('', ListTournamentsAction::class);

            // Authed lookups by owner/id. MUST be declared BEFORE the public
            // `/{slug}` catch-all: `mine` is a single segment and would
            // otherwise be captured by `{slug}` and routed to ShowTournamentAction.
            $tournaments->get('/mine', ListMyTournamentsAction::class)
                ->add(JwtAuthMiddleware::class);
            $tournaments->get('/by-id/{id}', ShowTournamentByIdAction::class)
                ->add(JwtAuthMiddleware::class);

            $tournaments->get('/{slug}', ShowTournamentAction::class);

            // Create: any authenticated user becomes organizer.
            $tournaments->post('', CreateTournamentAction::class)
                ->add(JwtAuthMiddleware::class);

            // Owner-only update/delete (ownership checked inside the action).
            $tournaments->put('/{id}', UpdateTournamentAction::class)
                ->add(JwtAuthMiddleware::class);
            $tournaments->delete('/{id}', DeleteTournamentAction::class)
                ->add(JwtAuthMiddleware::class);

            // Logo upload (owner|admin, multipart). Numeric {id} constraint keeps
            // it clear of the public single-segment `/{slug}` route. Two segments,
            // so no collision regardless.
            $tournaments->post('/{id:[0-9]+}/logo', UploadTournamentLogoAction::class)
                ->add(JwtAuthMiddleware::class);

            // Roles (organizer-only). {id} is the tournament id -> RoleMiddleware guards it.
            $tournaments->get('/{id}/roles', ListTournamentRolesAction::class)
                ->add($roleGuard->require('organizer'))
                ->add(JwtAuthMiddleware::class);
            $tournaments->post('/{id}/roles', CreateTournamentRoleAction::class)
                ->add($roleGuard->require('organizer'))
                ->add(JwtAuthMiddleware::class);

            // Fixtures read models (public). Calendar order = round number ASC.
            $tournaments->get('/{id}/rounds', ListRoundsAction::class);
            $tournaments->get('/{id}/matches', ListMatchesAction::class);

            // Stages (nested). List public; create organizer-only.
            $tournaments->get('/{id}/stages', ListStagesAction::class);
            $tournaments->post('/{id}/stages', CreateStageAction::class)
                ->add($roleGuard->require('organizer'))
                ->add(JwtAuthMiddleware::class);

            // Teams (nested). List public; create by organizer OR delegate.
            $tournaments->get('/{id}/teams', ListTeamsAction::class);
            $tournaments->post('/{id}/teams', CreateTeamAction::class)
                ->add($roleGuard->require('organizer', 'delegate'))
                ->add(JwtAuthMiddleware::class);

            // Player pool lookup by cédula (organizer|delegate, owner pool).
            $tournaments->get('/{id}/players/lookup', LookupPlayerAction::class)
                ->add($roleGuard->require('organizer', 'delegate'))
                ->add(JwtAuthMiddleware::class);

            // Registrations. Self-registration is code-gated (no pre-existing role,
            // so NO RoleMiddleware); the inbox listing is organizer-only.
            $tournaments->post('/{id}/registrations', CreateRegistrationAction::class)
                ->add(JwtAuthMiddleware::class);

            // Self-registration image uploads (code-gated, multipart). Same auth
            // model as CreateRegistrationAction: JWT + registration_code, no role.
            // Numeric {id} constraint keeps these clear of the public `/{slug}`.
            $tournaments->post('/{id:[0-9]+}/registration-logo', UploadRegistrationLogoAction::class)
                ->add(JwtAuthMiddleware::class);
            $tournaments->post('/{id:[0-9]+}/registration-photo', UploadRegistrationPhotoAction::class)
                ->add(JwtAuthMiddleware::class);
            $tournaments->get('/{id}/registrations', ListRegistrationsAction::class)
                ->add($roleGuard->require('organizer'))
                ->add(JwtAuthMiddleware::class);

            // Statistics (public). Derived from match_events. Paginated.
            $tournaments->get('/{id}/top-scorers', TopScorersAction::class);
            $tournaments->get('/{id}/cards', CardsAction::class);

            // Ads (public). Tournament slots + global fallback, resolved creative
            // per placement. {id} is the tournament id.
            $tournaments->get('/{id}/ads', TournamentAdsAction::class);

            // Referees directory (Fase 13). List public; create organizer-only
            // ({id} is the tournament id -> RoleMiddleware guards it).
            $tournaments->get('/{id}/referees', ListRefereesAction::class);
            $tournaments->post('/{id}/referees', CreateRefereeAction::class)
                ->add($roleGuard->require('organizer'))
                ->add(JwtAuthMiddleware::class);
        });

        // Tournament role removal. {id} is the role id -> authorized inside action.
        $group->delete('/tournament-roles/{id}', DeleteTournamentRoleAction::class)
            ->add(JwtAuthMiddleware::class);

        // Stages module ({id} is the stage id -> authorized inside action).
        $group->group('/stages', function (Group $stages) {
            $stages->put('/{id}', UpdateStageAction::class)
                ->add(JwtAuthMiddleware::class);
            $stages->delete('/{id}', DeleteStageAction::class)
                ->add(JwtAuthMiddleware::class);

            // Groups (nested under a stage). List public; create organizer-only.
            $stages->get('/{id}/groups', ListGroupsAction::class);
            $stages->post('/{id}/groups', CreateGroupAction::class)
                ->add(JwtAuthMiddleware::class);

            // Auto-distribute approved teams into N groups (organizer). Two
            // segments after the stage id => no collision with the single-segment
            // `/{id}/groups` create route.
            $stages->post('/{id}/groups/distribute', DistributeGroupsAction::class)
                ->add(JwtAuthMiddleware::class);

            // Advancement rules (nested under a stage).
            $stages->get('/{id}/advancement-rules', ListAdvancementRulesAction::class);
            $stages->post('/{id}/advancement-rules', CreateAdvancementRuleAction::class)
                ->add(JwtAuthMiddleware::class);

            // Fixture engine (organizer). {id} is the stage id -> tournament
            // resolved + authorized inside the action.
            $stages->post('/{id}/generate-fixtures', GenerateFixturesAction::class)
                ->add(JwtAuthMiddleware::class);
            $stages->post('/{id}/regenerate-fixtures', RegenerateFixturesAction::class)
                ->add(JwtAuthMiddleware::class);

            // Manual rounds (Fase 14). {id} is the stage id -> tournament
            // resolved + authorized inside the action. Two segments after the
            // stage id => no collision with the single-segment routes above.
            $stages->post('/{id}/rounds', CreateRoundAction::class)
                ->add(JwtAuthMiddleware::class);

            // Bulk match-sheet referee assignment (Fase 13). {id} is the stage
            // id -> tournament resolved + authorized inside the action. Assigns
            // to all stage matches, or only a round when round_id is given.
            $stages->post('/{id}/assign-referee', AssignStageRefereeAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Rounds module (Fase 14). {id} is the round id -> tournament resolved
        // via round -> stage and authorized inside the action.
        $group->group('/rounds', function (Group $rounds) {
            $rounds->put('/{id}', UpdateRoundAction::class)
                ->add(JwtAuthMiddleware::class);
            $rounds->delete('/{id}', DeleteRoundAction::class)
                ->add(JwtAuthMiddleware::class);

            // Manual match creation under a round.
            $rounds->post('/{id}/matches', CreateMatchAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Referees module (Fase 13). {id} is the referee id -> tournament
        // resolved via referee and authorized inside the action.
        $group->group('/referees', function (Group $referees) {
            $referees->put('/{id}', UpdateRefereeAction::class)
                ->add(JwtAuthMiddleware::class);
            $referees->delete('/{id}', DeleteRefereeAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Groups module ({id} is the group id -> authorized inside action).
        $group->group('/groups', function (Group $groups) {
            $groups->put('/{id}', UpdateGroupAction::class)
                ->add(JwtAuthMiddleware::class);
            $groups->delete('/{id}', DeleteGroupAction::class)
                ->add(JwtAuthMiddleware::class);

            // Group team assignment (deferred from Fase 2). List public; assign
            // organizer-only (authorized inside the action via group -> stage).
            $groups->get('/{id}/teams', ListGroupTeamsAction::class);
            $groups->post('/{id}/teams', AssignTeamToGroupAction::class)
                ->add(JwtAuthMiddleware::class);

            // Standings (public). Resolves the sport module's strategy.
            $groups->get('/{id}/standings', GroupStandingsAction::class);
        });

        // Advancement rules module ({id} is the rule id -> authorized inside action).
        $group->group('/advancement-rules', function (Group $rules) {
            $rules->put('/{id}', UpdateAdvancementRuleAction::class)
                ->add(JwtAuthMiddleware::class);
            $rules->delete('/{id}', DeleteAdvancementRuleAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Tournament teams module ({id} is the team id -> authorized inside action).
        $group->group('/tournament-teams', function (Group $teams) {
            $teams->put('/{id}', UpdateTeamAction::class)
                ->add(JwtAuthMiddleware::class);
            $teams->delete('/{id}', DeleteTeamAction::class)
                ->add(JwtAuthMiddleware::class);

            // Roster (nested under a team). List public; add organizer|delegate.
            $teams->get('/{id}/players', ListRosterAction::class);
            $teams->post('/{id}/players', AddPlayerToTeamAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Roster entries module ({id} is the team_players id -> authorized inside).
        $group->group('/team-players', function (Group $teamPlayers) {
            $teamPlayers->put('/{id}', UpdateTeamPlayerAction::class)
                ->add(JwtAuthMiddleware::class);
            $teamPlayers->delete('/{id}', DeleteTeamPlayerAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Players module ({id} is the player id -> authorized inside action).
        $group->group('/players', function (Group $players) {
            $players->get('/{id}/history', PlayerHistoryAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Registrations module ({id} is the registration id -> authorized inside).
        $group->group('/registrations', function (Group $registrations) {
            $registrations->patch('/{id}', UpdateRegistrationAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Group team removal ({id} is the group_teams id -> authorized inside).
        $group->group('/group-teams', function (Group $groupTeams) {
            $groupTeams->delete('/{id}', RemoveTeamFromGroupAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Matches module ({id} is the match id -> tournament resolved +
        // authorized inside the action). Metadata edits (Fase 4) + live control
        // (Fase 5). Referee endpoints are guarded by JwtAuthMiddleware (route) +
        // MatchRefereeAuthorizer (inline). The live read model is public.
        $group->group('/matches', function (Group $matches) {
            $matches->put('/{id}', UpdateMatchAction::class)
                ->add(JwtAuthMiddleware::class);

            // Manual match deletion (Fase 14). Refuses consolidated matches.
            $matches->delete('/{id}', DeleteMatchAction::class)
                ->add(JwtAuthMiddleware::class);

            // Live control (referee).
            $matches->post('/{id}/periods/start', StartPeriodAction::class)
                ->add(JwtAuthMiddleware::class);
            $matches->post('/{id}/periods/end', EndPeriodAction::class)
                ->add(JwtAuthMiddleware::class);
            $matches->post('/{id}/events', RecordEventAction::class)
                ->add(JwtAuthMiddleware::class);
            $matches->post('/{id}/finish', FinishMatchAction::class)
                ->add(JwtAuthMiddleware::class);

            // Match-sheet referee assignment (Fase 13). Body { referee_id:
            // int|null }. Distinct from referee_user_id (live control).
            $matches->post('/{id}/referee', AssignMatchRefereeAction::class)
                ->add(JwtAuthMiddleware::class);

            // Public live read model (polling).
            $matches->get('/{id}/live', LiveMatchAction::class);
        });

        // Match events module ({id} is the event id -> match resolved +
        // referee-authorized inside the action). Correction (delete) only.
        $group->group('/match-events', function (Group $matchEvents) {
            $matchEvents->delete('/{id}', DeleteEventAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Publicidad — public read (no auth). Global slots + resolved creative
        // per placement (default banner when nothing sold).
        $group->get('/ads', PublicAdsAction::class);

        // Publicidad — admin slot management. Each route guarded by
        // AdminMiddleware (after JwtAuthMiddleware: reverse add order => JwtAuth
        // runs first, then Admin).
        $group->group('/ad-slots', function (Group $adSlots) {
            $adSlots->get('', ListAdSlotsAction::class)
                ->add(AdminMiddleware::class)
                ->add(JwtAuthMiddleware::class);
            $adSlots->post('', CreateAdSlotAction::class)
                ->add(AdminMiddleware::class)
                ->add(JwtAuthMiddleware::class);
            $adSlots->put('/{id}', UpdateAdSlotAction::class)
                ->add(AdminMiddleware::class)
                ->add(JwtAuthMiddleware::class);
            $adSlots->delete('/{id}', DeleteAdSlotAction::class)
                ->add(AdminMiddleware::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Publicidad — admin per-tournament slot listing. Numeric {id} = the
        // tournament id. Returns its slots (each with creatives inline), NOT
        // paginated. Two segments under /admin/tournaments => no collision with
        // the public /tournaments/{id}/ads or other /tournaments routes.
        $group->get('/admin/tournaments/{id:[0-9]+}/ad-slots', ListTournamentAdSlotsAction::class)
            ->add(AdminMiddleware::class)
            ->add(JwtAuthMiddleware::class);

        // Publicidad — admin creative management + media upload.
        $group->group('/ad-creatives', function (Group $adCreatives) {
            $adCreatives->post('', CreateAdCreativeAction::class)
                ->add(AdminMiddleware::class)
                ->add(JwtAuthMiddleware::class);
            $adCreatives->post('/upload', UploadCreativeMediaAction::class)
                ->add(AdminMiddleware::class)
                ->add(JwtAuthMiddleware::class);
            $adCreatives->put('/{id}', UpdateAdCreativeAction::class)
                ->add(AdminMiddleware::class)
                ->add(JwtAuthMiddleware::class);
            $adCreatives->delete('/{id}', DeleteAdCreativeAction::class)
                ->add(AdminMiddleware::class)
                ->add(JwtAuthMiddleware::class);
        });
    });
};
