<?php

declare(strict_types=1);

namespace App\Application\Actions\GroupTeam;

use App\Application\Action\ApiAction;
use App\Application\Authorization\TournamentAuthorizer;
use App\Application\Responder\JsonResponder;
use App\Domain\Group\GroupRepository;
use App\Domain\GroupTeam\GroupTeamRepository;
use App\Domain\Shared\Exception\NotFoundException;
use App\Domain\Shared\Exception\ValidationException;
use App\Domain\Stage\StageRepository;
use App\Domain\Team\TeamRepository;
use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * POST /api/v1/groups/{id}/teams  (organizer)
 * Assigns a tournament team to a group (deferred from Fase 2). {id} is the group
 * id -> tournament resolved via group -> stage for the inline check. Unique per
 * (group, team).
 */
final class AssignTeamToGroupAction extends ApiAction
{
    public function __construct(
        JsonResponder $responder,
        private GroupTeamRepository $groupTeams,
        private GroupRepository $groups,
        private StageRepository $stages,
        private TeamRepository $teams,
        private TournamentAuthorizer $authorizer
    ) {
        parent::__construct($responder);
    }

    protected function handle(): Response
    {
        /** @var User $user */
        $user = $this->request->getAttribute('user');

        $groupId = (int) $this->arg('id', '0');

        $group = $this->groups->findById($groupId);
        if ($group === null) {
            throw new NotFoundException('Grupo no encontrado.');
        }

        $stage = $this->stages->findById($group->stageId);
        if ($stage === null) {
            throw new NotFoundException('Fase no encontrada.');
        }

        $this->authorizer->assert($user, $stage->tournamentId, ['organizer']);

        $body = $this->body();
        $teamId = isset($body['tournament_team_id']) ? (int) $body['tournament_team_id'] : 0;
        if ($teamId <= 0) {
            throw new ValidationException(['tournament_team_id' => 'Debes indicar el equipo a asignar.']);
        }

        $team = $this->teams->findById($teamId);
        if ($team === null) {
            throw new ValidationException(['tournament_team_id' => 'El equipo no existe.']);
        }
        if ($team->tournamentId !== $stage->tournamentId) {
            throw new ValidationException(['tournament_team_id' => 'El equipo no pertenece a este torneo.']);
        }

        if ($this->groupTeams->exists($groupId, $teamId)) {
            throw new ValidationException(['tournament_team_id' => 'El equipo ya está asignado a este grupo.']);
        }

        $seed = isset($body['seed']) && $body['seed'] !== '' ? (int) $body['seed'] : null;

        $groupTeam = $this->groupTeams->create([
            'group_id'           => $groupId,
            'tournament_team_id' => $teamId,
            'seed'               => $seed,
        ]);

        return $this->responder->created($this->response, $groupTeam);
    }
}
