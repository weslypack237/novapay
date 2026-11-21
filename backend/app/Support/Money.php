<?php

namespace App\Support;

use InvalidArgumentException;

/** Money is always integer minor units + explicit currency. No floats, ever. */
final class Money
{
    public static function exponent(string $currency): int
    {
        $config = config("novapay.currencies.{$currency}");
        if (! $config) {
            throw new InvalidArgumentException("Unsupported currency {$currency}");
        }

        return (int) $config['exponent'];
    }

    public static function isEnabled(string $currency): bool
    {
        return (bool) config("novapay.currencies.{$currency}.enabled", false);
    }

    /** Presentation only. Formats minor units without float arithmetic. */
    public static function format(int $amountMinor, string $currency): string
    {
        $exp = self::exponent($currency);
        $negative = $amountMinor < 0;
        $digits = (string) abs($amountMinor);

        if ($exp > 0) {
            $digits = str_pad($digits, $exp + 1, '0', STR_PAD_LEFT);
            $major = substr($digits, 0, -$exp);
            $minor = substr($digits, -$exp);
        } else {
            $major = $digits;
            $minor = '';
        }

        $major = ltrim(strrev(implode(',', str_split(strrev($major), 3))), ',');

        return ($negative ? '-' : '').$major.($minor !== '' ? '.'.$minor : '').' '.$currency;
    }
}
