<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function error(string $code, string $message, int $status)
    {
        return response()->json([
            'error' => ['code' => $code, 'message' => $message],
            'request_id' => request()->attributes->get('request_id'),
        ], $status);
    }
}
