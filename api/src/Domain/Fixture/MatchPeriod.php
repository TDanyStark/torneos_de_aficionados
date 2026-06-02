<?php

declare(strict_types=1);

namespace App\Domain\Fixture;

use JsonSerializable;

/**
 * A period (tiempo) of a match. The referee starts and ends each period; the
 * running period drives the live clock. Status: pending -> running -> finished.
 * DB table is `match_periods`.
 */
final class MatchPeriod implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $matchId,
        public readonly int $number,
        public readonly string $status,
        public readonly ?string $startedAt,
        public readonly ?string $endedAt,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
    ) {
    }

    /**
     * @param array<string,mixed> $row
     */
    public static function fromRow(array $row): self
    {
        $str = static fn (string $k): ?string =>
            isset($row[$k]) && $row[$k] !== null ? (string) $row[$k] : null;

        return new self(
            (int) $row['id'],
            (int) $row['match_id'],
            (int) $row['number'],
            (string) $row['status'],
            $str('started_at'),
            $str('ended_at'),
            $str('created_at'),
            $str('updated_at'),
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            'id'         => $this->id,
            'match_id'   => $this->matchId,
            'number'     => $this->number,
            'status'     => $this->status,
            'started_at' => $this->startedAt,
            'ended_at'   => $this->endedAt,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
