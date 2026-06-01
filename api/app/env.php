<?php

declare(strict_types=1);

use Dotenv\Dotenv;

/**
 * Loads environment variables from the .env file located at the api/ root.
 * Safe to call multiple times; createImmutable is only run once.
 */
if (!function_exists('loadEnv')) {
    function loadEnv(): void
    {
        static $loaded = false;
        if ($loaded) {
            return;
        }

        $rootPath = dirname(__DIR__);
        if (file_exists($rootPath . '/.env')) {
            $dotenv = Dotenv::createImmutable($rootPath);
            $dotenv->safeLoad();
        }

        $loaded = true;
    }
}

if (!function_exists('env')) {
    /**
     * Reads an environment variable with an optional default and basic casting.
     *
     * @param mixed $default
     * @return mixed
     */
    function env(string $key, $default = null)
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

        if ($value === false || $value === null) {
            return $default;
        }

        switch (strtolower((string) $value)) {
            case 'true':
                return true;
            case 'false':
                return false;
            case 'null':
                return null;
            case 'empty':
                return '';
        }

        return $value;
    }
}

loadEnv();
