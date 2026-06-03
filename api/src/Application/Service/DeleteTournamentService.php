<?php

declare(strict_types=1);

namespace App\Application\Service;

use PDO;

/**
 * Coordinates the DESTRUCTIVE deletion of a whole tournament. Unlike the
 * tournament soft-delete this previously was, "borrar" here means remove
 * EVERYTHING associated: teams, rosters, matches, the goals/cards recorded
 * against those matches, group/bracket placements, registrations, per-user
 * roles — and the uploaded image files (tournament logo, team logos, player
 * photos) from disk.
 *
 * Most child tables FK to tournaments with ON DELETE CASCADE, so a single
 * `DELETE FROM tournaments` cascades stages, groups, rounds, registrations,
 * roles and tournament_teams. The exception is `team_players.player_id ->
 * players` which is RESTRICT (players are a SHARED organizer pool, reused
 * across tournaments). We therefore remove the roster rows (team_players)
 * explicitly first and DELIBERATELY PRESERVE the pooled `players` themselves.
 *
 * File cleanup: image URLs are collected BEFORE the rows are deleted, then the
 * files are unlinked AFTER the DB transaction commits (so a rollback never
 * leaves orphaned data, and a failed unlink never aborts a committed delete).
 *
 * Mirrors the transaction-coordinator pattern of DeleteTeamService: injects the
 * shared PDO and wraps the multi-table purge in a single transaction.
 */
final class DeleteTournamentService
{
    /** Filesystem root for stored uploads (api/public). */
    private string $publicDir;

    public function __construct(private PDO $pdo)
    {
        // src/Application/Service -> project root is three levels up.
        $this->publicDir = dirname(__DIR__, 3) . '/public';
    }

    /**
     * Counts of what a deletion would remove, so the UI can warn the organizer
     * before they confirm an irreversible deletion.
     *
     * @return array{teams:int,players:int,matches:int,events:int}
     */
    public function impact(int $tournamentId): array
    {
        return [
            'teams'   => $this->scalar(
                'SELECT COUNT(*) FROM tournament_teams WHERE tournament_id = :t',
                ['t' => $tournamentId]
            ),
            'players' => $this->scalar(
                'SELECT COUNT(DISTINCT tp.player_id)
                 FROM team_players tp
                 INNER JOIN tournament_teams tt ON tt.id = tp.tournament_team_id
                 WHERE tt.tournament_id = :t',
                ['t' => $tournamentId]
            ),
            'matches' => $this->scalar(
                'SELECT COUNT(*) FROM matches WHERE tournament_id = :t',
                ['t' => $tournamentId]
            ),
            'events'  => $this->scalar(
                'SELECT COUNT(*) FROM match_events me
                 INNER JOIN matches m ON m.id = me.match_id
                 WHERE m.tournament_id = :t',
                ['t' => $tournamentId]
            ),
        ];
    }

    /**
     * Atomically purge a tournament and everything under it, then unlink the
     * associated upload files. Pooled players are preserved.
     */
    public function delete(int $tournamentId): void
    {
        // Collect file paths to unlink BEFORE the rows vanish.
        $files = $this->collectImageUrls($tournamentId);

        $this->pdo->beginTransaction();

        try {
            // 1) match_events (goals/cards/period markers) for this tournament's
            //    matches. Removed before the matches so nothing dangles.
            $this->exec(
                'DELETE me FROM match_events me
                 INNER JOIN matches m ON m.id = me.match_id
                 WHERE m.tournament_id = :t',
                ['t' => $tournamentId]
            );

            // 2) The matches themselves (partidos).
            $this->exec('DELETE FROM matches WHERE tournament_id = :t', ['t' => $tournamentId]);

            // 3) Roster entries for every team in this tournament. Pooled
            //    players are preserved; this only clears the RESTRICT FK that
            //    would otherwise block the cascade.
            $this->exec(
                'DELETE tp FROM team_players tp
                 INNER JOIN tournament_teams tt ON tt.id = tp.tournament_team_id
                 WHERE tt.tournament_id = :t',
                ['t' => $tournamentId]
            );

            // 4) Delete the tournament. ON DELETE CASCADE removes stages,
            //    groups, advancement_rules, rounds, bracket_slots, group_teams,
            //    tournament_teams, registrations and tournament_user_roles.
            $this->exec('DELETE FROM tournaments WHERE id = :t', ['t' => $tournamentId]);

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        // 5) Best-effort file cleanup AFTER commit. A missing/failed unlink must
        //    never resurrect the (already deleted) tournament.
        $this->unlinkFiles($files);
    }

    /**
     * Collects every stored image URL tied to the tournament: its own logo,
     * each team's logo, and the photos of players that belong EXCLUSIVELY to
     * this tournament (a pooled player used elsewhere keeps its photo).
     *
     * @return array<int,string> public URLs like "/uploads/teams/<hex>.jpg"
     */
    private function collectImageUrls(int $tournamentId): array
    {
        $urls = [];

        // Tournament logo.
        $logo = $this->pdo->prepare('SELECT logo_url FROM tournaments WHERE id = :t');
        $logo->execute(['t' => $tournamentId]);
        $tLogo = $logo->fetchColumn();
        if (is_string($tLogo) && $tLogo !== '') {
            $urls[] = $tLogo;
        }

        // Team logos.
        $teams = $this->pdo->prepare(
            'SELECT logo_url FROM tournament_teams
             WHERE tournament_id = :t AND logo_url IS NOT NULL AND logo_url <> \'\''
        );
        $teams->execute(['t' => $tournamentId]);
        foreach ($teams->fetchAll(PDO::FETCH_COLUMN) as $url) {
            if (is_string($url) && $url !== '') {
                $urls[] = $url;
            }
        }

        // Photos of players used ONLY by this tournament. A player appearing in
        // any other tournament's roster is shared and must keep its photo.
        $players = $this->pdo->prepare(
            'SELECT DISTINCT p.photo_url
             FROM players p
             INNER JOIN team_players tp ON tp.player_id = p.id
             INNER JOIN tournament_teams tt ON tt.id = tp.tournament_team_id
             WHERE tt.tournament_id = :t
               AND p.photo_url IS NOT NULL AND p.photo_url <> \'\'
               AND NOT EXISTS (
                   SELECT 1
                   FROM team_players tp2
                   INNER JOIN tournament_teams tt2 ON tt2.id = tp2.tournament_team_id
                   WHERE tp2.player_id = p.id AND tt2.tournament_id <> :t2
               )'
        );
        $players->execute(['t' => $tournamentId, 't2' => $tournamentId]);
        foreach ($players->fetchAll(PDO::FETCH_COLUMN) as $url) {
            if (is_string($url) && $url !== '') {
                $urls[] = $url;
            }
        }

        return array_values(array_unique($urls));
    }

    /**
     * Unlinks stored upload files by their public URL. Best-effort: paths are
     * confined to the uploads dir and missing files are ignored.
     *
     * @param array<int,string> $urls
     */
    private function unlinkFiles(array $urls): void
    {
        foreach ($urls as $url) {
            // Only handle our own stored uploads; ignore external/absolute URLs.
            if (!str_starts_with($url, '/uploads/')) {
                continue;
            }

            $path = $this->publicDir . $url;
            $real = realpath($path);
            if ($real === false) {
                continue;
            }
            // Defense in depth: never unlink outside the uploads tree.
            $uploadsRoot = realpath($this->publicDir . '/uploads');
            if ($uploadsRoot === false || !str_starts_with($real, $uploadsRoot)) {
                continue;
            }

            if (is_file($real)) {
                @unlink($real);
            }
        }
    }

    /**
     * @param array<string,int> $params
     */
    private function scalar(string $sql, array $params): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * @param array<string,int> $params
     */
    private function exec(string $sql, array $params): void
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
    }
}
