<?php

use Illuminate\Support\Facades\Route;

// The API serves no HTML. The web app lives in apps/web.
Route::get('/', fn () => response()->json(['service' => 'novapay-api', 'docs' => '/docs/api/openapi.yaml']));
