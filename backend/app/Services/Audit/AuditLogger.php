<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogger
{
    /** Keys that must never be written to an audit record. */
    private const REDACT = ['password', 'otp', 'code', 'token', 'pan', 'cvv', 'secret'];

    public function __construct(private readonly ?Request $request = null) {}

    public function record(
        string $action,
        ?User $actor = null,
        ?string $resourceType = null,
        ?string $resourceId = null,
        ?string $reason = null,
        array $metadata = [],
    ): AuditLog {
        $request = $this->request ?? request();

        return AuditLog::create([
            'actor_user_id' => $actor?->id,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => $request?->ip(),
            'user_agent' => substr((string) $request?->userAgent(), 0, 500),
            'reason' => $reason,
            'request_id' => $request?->attributes->get('request_id'),
            'metadata' => $this->redact($metadata) ?: null,
        ]);
    }

    private function redact(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->redact($value);
            } elseif (is_string($key) && $this->isSensitive($key)) {
                $data[$key] = '[redacted]';
            }
        }

        return $data;
    }

    private function isSensitive(string $key): bool
    {
        $key = strtolower($key);
        foreach (self::REDACT as $needle) {
            if (str_contains($key, $needle)) {
                return true;
            }
        }

        return false;
    }
}
