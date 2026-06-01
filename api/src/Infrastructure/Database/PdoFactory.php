<?php

declare(strict_types=1);

namespace App\Infrastructure\Database;

use PDO;

/**
 * Creates a configured PDO connection for MySQL.
 */
final class PdoFactory
{
    /**
     * @param array{host:string,port:int,name:string,user:string,pass:string,charset:string} $config
     */
    public static function create(array $config): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['name'],
            $config['charset']
        );

        return new PDO(
            $dsn,
            $config['user'],
            $config['pass'],
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }
}
