<?php

namespace Tests\Unit;

use App\Support\Money;
use Tests\TestCase;

class MoneyTest extends TestCase
{
    public function test_formats_minor_units_without_floats(): void
    {
        $this->assertSame('250,000 XAF', Money::format(250_000, 'XAF'));
        $this->assertSame('1,234.05 USD', Money::format(123_405, 'USD'));
        $this->assertSame('0.07 USD', Money::format(7, 'USD'));
        $this->assertSame('-1,000 XAF', Money::format(-1_000, 'XAF'));
    }
}
