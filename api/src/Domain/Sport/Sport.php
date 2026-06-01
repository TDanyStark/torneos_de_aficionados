<?php

declare(strict_types=1);

namespace App\Domain\Sport;

use JsonSerializable;

/**
 * Sport catalog entry (read-only). default_config seeds a tournament's
 * points/periods at creation time.
 */
final class Sport implements JsonSerializable
{
    /**
     * @param array<string,mixed>|null $defaultConfig
     */
    public function __construct(
        public readonly int $id,
        public readonly string $moduleKey,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $variant,
        public readonly ?int $playersPerSide,
        public readonly ?array $defaultConfig,
        public readonly bool $isActive,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        $config = null;
        if (isset($row['default_config']) && $row['default_config'] !== null && $row['default_config'] !== '') {
            $decoded = json_decode((string) $row['default_config'], true);
            $config = is_array($decoded) ? $decoded : null;
        }

        return new self(
            (int) $row['id'],
            (string) $row['module_key'],
            (string) $row['name'],
            (string) $row['slug'],
            $row['variant'] !== null ? (string) $row['variant'] : null,
            $row['players_per_side'] !== null ? (int) $row['players_per_side'] : null,
            $config,
            (bool) $row['is_active'],
            isset($row['created_at']) ? (string) $row['created_at'] : null,
            isset($row['updated_at']) ? (string) $row['updated_at'] : null,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'               => $this->id,
            'module_key'       => $this->moduleKey,
            'name'             => $this->name,
            'slug'             => $this->slug,
            'variant'          => $this->variant,
            'players_per_side' => $this->playersPerSide,
            'default_config'   => $this->defaultConfig,
            'is_active'        => $this->isActive,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
