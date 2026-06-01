<?php

declare(strict_types=1);

namespace App\Domain\Shared;

/**
 * Pure helpers for generating URL-safe slugs and random codes.
 */
final class Slug
{
    /**
     * Converts arbitrary text to a kebab-case ASCII slug.
     */
    public static function make(string $text): string
    {
        $text = trim($text);

        // Transliterate accented characters to ASCII when the extension exists.
        if (function_exists('iconv')) {
            $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
            if ($converted !== false) {
                $text = $converted;
            }
        }

        $text = strtolower($text);
        $text = (string) preg_replace('/[^a-z0-9]+/', '-', $text);
        $text = trim($text, '-');

        return $text !== '' ? $text : 'torneo';
    }

    /**
     * Random uppercase alphanumeric code (e.g. registration codes).
     */
    public static function code(int $length = 8): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $max = strlen($alphabet) - 1;
        $code = '';
        for ($i = 0; $i < $length; $i++) {
            $code .= $alphabet[random_int(0, $max)];
        }

        return $code;
    }
}
