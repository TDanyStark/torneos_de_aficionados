<?php

declare(strict_types=1);

namespace App\Domain\Sport;

use App\Domain\Sport\Contracts\SportModule;
use App\Domain\Shared\Exception\NotFoundException;

/**
 * Maps sports.module_key -> SportModule implementation. The core resolves the
 * right module at runtime without embedding sport-specific logic.
 */
final class SportModuleRegistry
{
    /** @var array<string,SportModule> */
    private array $modules = [];

    /**
     * @param iterable<SportModule> $modules
     */
    public function __construct(iterable $modules = [])
    {
        foreach ($modules as $module) {
            $this->register($module);
        }
    }

    public function register(SportModule $module): void
    {
        $this->modules[$module->key()] = $module;
    }

    public function has(string $key): bool
    {
        return isset($this->modules[$key]);
    }

    public function get(string $key): SportModule
    {
        if (!$this->has($key)) {
            throw new NotFoundException(sprintf('Deporte no soportado: %s', $key));
        }

        return $this->modules[$key];
    }

    /**
     * @return array<int,string>
     */
    public function keys(): array
    {
        return array_keys($this->modules);
    }
}
