<?php

declare(strict_types=1);

namespace Tests\Domain\Ad;

use App\Domain\Ad\AdCreative;
use App\Domain\Ad\AdSlot;
use App\Domain\Ad\CreativeResolver;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class CreativeResolverTest extends TestCase
{
    private CreativeResolver $resolver;
    private DateTimeImmutable $now;

    protected function setUp(): void
    {
        $this->resolver = new CreativeResolver();
        $this->now = new DateTimeImmutable('2026-06-15 12:00:00');
    }

    /**
     * @param array<string,mixed> $overrides
     */
    private function creative(array $overrides = []): AdCreative
    {
        return AdCreative::fromRow(array_merge([
            'id'         => 1,
            'ad_slot_id' => 1,
            'media_type' => 'image',
            'media_url'  => 'https://cdn.test/a.png',
            'cta_url'    => null,
            'cta_label'  => null,
            'is_default' => 0,
            'is_active'  => 1,
            'starts_at'  => null,
            'ends_at'    => null,
            'created_at' => '2026-06-01 00:00:00',
            'updated_at' => '2026-06-01 00:00:00',
        ], $overrides));
    }

    private function slot(int $id, string $placement, ?int $tournamentId, bool $active = true): AdSlot
    {
        return AdSlot::fromRow([
            'id'            => $id,
            'tournament_id' => $tournamentId,
            'placement'     => $placement,
            'name'          => "slot-$id",
            'is_active'     => $active ? 1 : 0,
            'created_at'    => '2026-06-01 00:00:00',
            'updated_at'    => '2026-06-01 00:00:00',
        ]);
    }

    private function defaultCreative(int $id = 99): AdCreative
    {
        return $this->creative([
            'id'         => $id,
            'is_default' => 1,
            'cta_url'    => 'https://wa.me/573000000000',
            'cta_label'  => 'Este espacio está disponible',
        ]);
    }

    // --- resolveForSlot -----------------------------------------------------

    public function testActiveNonDefaultWithinWindowIsServed(): void
    {
        $served = $this->creative([
            'id'        => 5,
            'starts_at' => '2026-06-10 00:00:00',
            'ends_at'   => '2026-06-20 00:00:00',
        ]);
        $default = $this->defaultCreative();

        $result = $this->resolver->resolveForSlot([$default, $served], $this->now);

        self::assertNotNull($result);
        self::assertSame(5, $result->id);
        self::assertFalse($result->isDefault);
    }

    public function testExpiredCreativeFallsBackToDefault(): void
    {
        $expired = $this->creative([
            'id'        => 5,
            'starts_at' => '2026-06-01 00:00:00',
            'ends_at'   => '2026-06-10 00:00:00', // ended before now
        ]);
        $default = $this->defaultCreative();

        $result = $this->resolver->resolveForSlot([$expired, $default], $this->now);

        self::assertNotNull($result);
        self::assertTrue($result->isDefault);
        self::assertSame(99, $result->id);
    }

    public function testNotYetStartedCreativeFallsBackToDefault(): void
    {
        $future = $this->creative([
            'id'        => 5,
            'starts_at' => '2026-06-20 00:00:00', // starts after now
            'ends_at'   => null,
        ]);
        $default = $this->defaultCreative();

        $result = $this->resolver->resolveForSlot([$future, $default], $this->now);

        self::assertNotNull($result);
        self::assertTrue($result->isDefault);
    }

    public function testNullWindowIsAlwaysValid(): void
    {
        $always = $this->creative(['id' => 5, 'starts_at' => null, 'ends_at' => null]);

        $result = $this->resolver->resolveForSlot([$always], $this->now);

        self::assertNotNull($result);
        self::assertSame(5, $result->id);
        self::assertFalse($result->isDefault);
    }

    public function testStartBoundaryInclusiveAndEndBoundaryInclusive(): void
    {
        $boundary = $this->creative([
            'id'        => 7,
            'starts_at' => '2026-06-15 12:00:00', // exactly now
            'ends_at'   => '2026-06-15 12:00:00', // exactly now
        ]);

        $result = $this->resolver->resolveForSlot([$boundary], $this->now);

        self::assertNotNull($result);
        self::assertSame(7, $result->id);
    }

    public function testInactiveCreativeIsExcluded(): void
    {
        $inactive = $this->creative(['id' => 5, 'is_active' => 0]);
        $default  = $this->defaultCreative();

        $result = $this->resolver->resolveForSlot([$inactive, $default], $this->now);

        self::assertNotNull($result);
        self::assertTrue($result->isDefault);
    }

    public function testInactiveDefaultMeansNoServeWhenNoSellable(): void
    {
        $inactiveDefault = $this->creative(['id' => 99, 'is_default' => 1, 'is_active' => 0]);

        $result = $this->resolver->resolveForSlot([$inactiveDefault], $this->now);

        self::assertNull($result);
    }

    public function testMultipleActiveMostRecentWins(): void
    {
        $older = $this->creative(['id' => 3]);
        $newer = $this->creative(['id' => 8]);
        $middle = $this->creative(['id' => 5]);

        $result = $this->resolver->resolveForSlot([$older, $newer, $middle], $this->now);

        self::assertNotNull($result);
        self::assertSame(8, $result->id);
    }

    public function testNoSellableReturnsDefault(): void
    {
        $default = $this->defaultCreative();

        $result = $this->resolver->resolveForSlot([$default], $this->now);

        self::assertNotNull($result);
        self::assertTrue($result->isDefault);
    }

    public function testEmptyCreativesReturnsNull(): void
    {
        self::assertNull($this->resolver->resolveForSlot([], $this->now));
    }

    // --- resolveGlobals -----------------------------------------------------

    public function testResolveGlobalsKeysByPlacement(): void
    {
        $bundles = [
            [
                'slot'      => $this->slot(1, 'header', null),
                'creatives' => [$this->creative(['id' => 10])],
            ],
            [
                'slot'      => $this->slot(2, 'footer', null),
                'creatives' => [$this->defaultCreative(98)],
            ],
        ];

        $map = $this->resolver->resolveGlobals($bundles, $this->now);

        self::assertArrayHasKey('header', $map);
        self::assertArrayHasKey('footer', $map);
        self::assertSame(10, $map['header']['creative']->id);
        self::assertTrue($map['footer']['creative']->isDefault);
        self::assertSame(1, $map['header']['slot']->id);
    }

    public function testResolveGlobalsOmitsSlotWithNoServeableCreative(): void
    {
        $bundles = [
            [
                'slot'      => $this->slot(1, 'header', null),
                'creatives' => [], // nothing to serve
            ],
        ];

        $map = $this->resolver->resolveGlobals($bundles, $this->now);

        self::assertArrayNotHasKey('header', $map);
    }

    // --- resolveTournament --------------------------------------------------

    public function testTournamentSlotOverridesGlobalForPlacement(): void
    {
        $globals = [
            [
                'slot'      => $this->slot(1, 'header', null),
                'creatives' => [$this->creative(['id' => 10, 'ad_slot_id' => 1])],
            ],
        ];
        $tournament = [
            [
                'slot'      => $this->slot(2, 'header', 50),
                'creatives' => [$this->creative(['id' => 20, 'ad_slot_id' => 2])],
            ],
        ];

        $map = $this->resolver->resolveTournament($tournament, $globals, $this->now);

        self::assertArrayHasKey('header', $map);
        self::assertSame(2, $map['header']['slot']->id, 'tournament slot wins');
        self::assertSame(20, $map['header']['creative']->id);
    }

    public function testMissingTournamentPlacementFallsBackToGlobal(): void
    {
        $globals = [
            [
                'slot'      => $this->slot(1, 'footer', null),
                'creatives' => [$this->creative(['id' => 10, 'ad_slot_id' => 1])],
            ],
        ];
        $tournament = [
            [
                'slot'      => $this->slot(2, 'header', 50),
                'creatives' => [$this->creative(['id' => 20, 'ad_slot_id' => 2])],
            ],
        ];

        $map = $this->resolver->resolveTournament($tournament, $globals, $this->now);

        // header from tournament, footer falls back to global.
        self::assertArrayHasKey('header', $map);
        self::assertArrayHasKey('footer', $map);
        self::assertSame(2, $map['header']['slot']->id);
        self::assertSame(1, $map['footer']['slot']->id);
    }

    public function testPlacementAbsentInBothIsNotPresent(): void
    {
        $globals = [
            [
                'slot'      => $this->slot(1, 'header', null),
                'creatives' => [$this->creative(['id' => 10])],
            ],
        ];
        $tournament = [];

        $map = $this->resolver->resolveTournament($tournament, $globals, $this->now);

        self::assertArrayNotHasKey('sidebar', $map);
        self::assertArrayNotHasKey('match_live', $map);
        self::assertArrayHasKey('header', $map);
    }

    public function testInactiveSlotIsSkipped(): void
    {
        $bundles = [
            [
                'slot'      => $this->slot(1, 'header', null, false), // inactive slot
                'creatives' => [$this->creative(['id' => 10])],
            ],
        ];

        $map = $this->resolver->resolveGlobals($bundles, $this->now);

        self::assertArrayNotHasKey('header', $map);
    }
}
