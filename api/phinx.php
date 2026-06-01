<?php

declare(strict_types=1);

require __DIR__ . '/app/env.php';

return [
    'paths' => [
        'migrations' => __DIR__ . '/database/migrations',
        'seeds'      => __DIR__ . '/database/seeds',
    ],
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment'     => 'local',
        'local' => [
            'adapter' => 'mysql',
            'host'    => (string) env('DB_HOST', 'localhost'),
            'name'    => (string) env('DB_NAME', 'torneos_de_aficionados'),
            'user'    => (string) env('DB_USER', 'root'),
            'pass'    => (string) env('DB_PASS', ''),
            'port'    => (int) env('DB_PORT', 3306),
            'charset' => (string) env('DB_CHARSET', 'utf8mb4'),
        ],
    ],
    'version_order' => 'creation',
];
