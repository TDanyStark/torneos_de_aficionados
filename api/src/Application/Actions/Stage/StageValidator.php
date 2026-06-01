<?php

declare(strict_types=1);

namespace App\Application\Actions\Stage;

/**
 * Pure validation helpers shared by Stage create/update actions.
 */
final class StageValidator
{
    public const TYPES = ['league', 'groups', 'knockout'];

    /**
     * @return array<int,string>|null Returns a normalized list of tiebreaker
     *                                strings, or null when empty/invalid.
     * @param mixed $raw
     */
    public static function normalizeTiebreakers($raw): ?array
    {
        if (!is_array($raw) || $raw === []) {
            return null;
        }

        $list = [];
        foreach ($raw as $item) {
            $value = trim((string) $item);
            if ($value !== '') {
                $list[] = $value;
            }
        }

        return $list !== [] ? $list : null;
    }

    public static function isValidLegs(int $legs): bool
    {
        return $legs === 1 || $legs === 2;
    }
}
