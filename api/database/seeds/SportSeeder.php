<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class SportSeeder extends AbstractSeed
{
    public function run(): void
    {
        $now = date('Y-m-d H:i:s');

        $defaultConfig = static function (int $periods): string {
            return json_encode([
                'periods'      => $periods,
                'points_win'   => 3,
                'points_draw'  => 1,
                'points_loss'  => 0,
                'allows_draws' => true,
            ], JSON_THROW_ON_ERROR);
        };

        $rows = [
            [
                'module_key'       => 'football',
                'name'             => 'Fútbol 11',
                'slug'             => 'futbol-11',
                'variant'          => '11',
                'players_per_side' => 11,
                'default_config'   => $defaultConfig(2),
                'is_active'        => 1,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'module_key'       => 'football',
                'name'             => 'Fútbol 8',
                'slug'             => 'futbol-8',
                'variant'          => '8',
                'players_per_side' => 8,
                'default_config'   => $defaultConfig(2),
                'is_active'        => 1,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'module_key'       => 'football',
                'name'             => 'Fútbol 5',
                'slug'             => 'futbol-5',
                'variant'          => '5',
                'players_per_side' => 5,
                'default_config'   => $defaultConfig(2),
                'is_active'        => 1,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'module_key'       => 'football',
                'name'             => 'Microfútbol',
                'slug'             => 'microfutbol',
                'variant'          => 'micro',
                'players_per_side' => 5,
                'default_config'   => $defaultConfig(2),
                'is_active'        => 1,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
        ];

        $this->table('sports')->insert($rows)->saveData();
    }
}
