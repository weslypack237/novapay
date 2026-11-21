#!/bin/sh
set -e
cd /var/www/backend
[ -f .env ] || cp .env.example .env
composer install --no-interaction --prefer-dist
grep -q '^APP_KEY=base64' .env || php artisan key:generate --force
php artisan migrate --force --seed
php artisan ledger:check
exec php artisan serve --host=0.0.0.0 --port=8000
