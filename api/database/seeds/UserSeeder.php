<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class UserSeeder extends AbstractSeed
{
    public function run(): void
    {
        $now = date('Y-m-d H:i:s');

        $rows = [
            [
                'name'          => 'Admin Demo',
                'email'         => 'admin@torneos.test',
                'phone'         => null,
                'password_hash' => password_hash('admin1234', PASSWORD_ARGON2ID),
                'is_admin'      => 1,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'name'          => 'Organizador Demo',
                'email'         => 'organizador@torneos.test',
                'phone'         => null,
                'password_hash' => password_hash('organizador1234', PASSWORD_ARGON2ID),
                'is_admin'      => 0,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
        ];

        $this->table('users')->insert($rows)->saveData();
    }
}
