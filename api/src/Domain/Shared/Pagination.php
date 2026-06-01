<?php

declare(strict_types=1);

namespace App\Domain\Shared;

/**
 * Immutable pagination value object. Normalizes page/per_page and exposes meta.
 */
final class Pagination
{
    private const DEFAULT_PER_PAGE = 20;
    private const MAX_PER_PAGE = 100;

    public readonly int $page;
    public readonly int $perPage;

    public function __construct(int $page, int $perPage)
    {
        $this->page = max(1, $page);
        $this->perPage = min(self::MAX_PER_PAGE, max(1, $perPage));
    }

    public static function fromQuery(array $query): self
    {
        return new self(
            (int) ($query['page'] ?? 1),
            (int) ($query['per_page'] ?? self::DEFAULT_PER_PAGE)
        );
    }

    public function offset(): int
    {
        return ($this->page - 1) * $this->perPage;
    }

    public function limit(): int
    {
        return $this->perPage;
    }

    /**
     * @return array{page:int,per_page:int,total:int,total_pages:int,has_next:bool}
     */
    public function meta(int $total): array
    {
        $totalPages = $this->perPage > 0 ? (int) ceil($total / $this->perPage) : 0;

        return [
            'page'        => $this->page,
            'per_page'    => $this->perPage,
            'total'       => $total,
            'total_pages' => $totalPages,
            'has_next'    => $this->page < $totalPages,
        ];
    }
}
