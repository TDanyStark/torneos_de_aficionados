<?php

declare(strict_types=1);

use App\Application\Actions\AdvancementRule\CreateAdvancementRuleAction;
use App\Application\Actions\AdvancementRule\DeleteAdvancementRuleAction;
use App\Application\Actions\AdvancementRule\ListAdvancementRulesAction;
use App\Application\Actions\AdvancementRule\UpdateAdvancementRuleAction;
use App\Application\Actions\Auth\LoginAction;
use App\Application\Actions\Auth\MeAction;
use App\Application\Actions\Auth\RegisterAction;
use App\Application\Actions\Group\CreateGroupAction;
use App\Application\Actions\Group\DeleteGroupAction;
use App\Application\Actions\Group\ListGroupsAction;
use App\Application\Actions\Group\UpdateGroupAction;
use App\Application\Actions\Health\HealthAction;
use App\Application\Actions\Role\CreateTournamentRoleAction;
use App\Application\Actions\Role\DeleteTournamentRoleAction;
use App\Application\Actions\Role\ListTournamentRolesAction;
use App\Application\Actions\Sport\ListSportsAction;
use App\Application\Actions\Stage\CreateStageAction;
use App\Application\Actions\Stage\DeleteStageAction;
use App\Application\Actions\Stage\ListStagesAction;
use App\Application\Actions\Stage\UpdateStageAction;
use App\Application\Actions\Tournament\CreateTournamentAction;
use App\Application\Actions\Tournament\DeleteTournamentAction;
use App\Application\Actions\Tournament\ListTournamentsAction;
use App\Application\Actions\Tournament\ShowTournamentAction;
use App\Application\Actions\Tournament\UpdateTournamentAction;
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

        // Sports module (public catalog)
        $group->group('/sports', function (Group $sports) {
            $sports->get('', ListSportsAction::class);
        });

        // Tournaments module
        $group->group('/tournaments', function (Group $tournaments) use ($roleGuard) {
            // Public
            $tournaments->get('', ListTournamentsAction::class);
            $tournaments->get('/{slug}', ShowTournamentAction::class);

            // Create: any authenticated user becomes organizer.
            $tournaments->post('', CreateTournamentAction::class)
                ->add(JwtAuthMiddleware::class);

            // Owner-only update/delete (ownership checked inside the action).
            $tournaments->put('/{id}', UpdateTournamentAction::class)
                ->add(JwtAuthMiddleware::class);
            $tournaments->delete('/{id}', DeleteTournamentAction::class)
                ->add(JwtAuthMiddleware::class);

            // Roles (organizer-only). {id} is the tournament id -> RoleMiddleware guards it.
            $tournaments->get('/{id}/roles', ListTournamentRolesAction::class)
                ->add($roleGuard->require('organizer'))
                ->add(JwtAuthMiddleware::class);
            $tournaments->post('/{id}/roles', CreateTournamentRoleAction::class)
                ->add($roleGuard->require('organizer'))
                ->add(JwtAuthMiddleware::class);

            // Stages (nested). List public; create organizer-only.
            $tournaments->get('/{id}/stages', ListStagesAction::class);
            $tournaments->post('/{id}/stages', CreateStageAction::class)
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

            // Advancement rules (nested under a stage).
            $stages->get('/{id}/advancement-rules', ListAdvancementRulesAction::class);
            $stages->post('/{id}/advancement-rules', CreateAdvancementRuleAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Groups module ({id} is the group id -> authorized inside action).
        $group->group('/groups', function (Group $groups) {
            $groups->put('/{id}', UpdateGroupAction::class)
                ->add(JwtAuthMiddleware::class);
            $groups->delete('/{id}', DeleteGroupAction::class)
                ->add(JwtAuthMiddleware::class);
        });

        // Advancement rules module ({id} is the rule id -> authorized inside action).
        $group->group('/advancement-rules', function (Group $rules) {
            $rules->put('/{id}', UpdateAdvancementRuleAction::class)
                ->add(JwtAuthMiddleware::class);
            $rules->delete('/{id}', DeleteAdvancementRuleAction::class)
                ->add(JwtAuthMiddleware::class);
        });
    });
};
