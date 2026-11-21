# Threat model — milestone 1 (living document)

| # | Threat | Mitigation now | Still to do |
|---|--------|----------------|-------------|
| 1 | Token theft via XSS | Token only in httpOnly cookie (BFF); React escaping; no `dangerouslySetInnerHTML` except the static theme script | CSP with nonces before launch |
| 2 | Credential stuffing / brute force | Per identifier+IP login limiter (5/min), route throttles, generic error message | Suspicious-login alerts, device fingerprinting, MFA step-up |
| 3 | OTP guessing | Hashed codes, 10-min expiry, 5 attempts, resend limit, previous codes invalidated | SMS provider fraud controls |
| 4 | Double credit / double debit | Idempotency key + payload hash, unique index, replay returns original | Provider-reference uniqueness on deposits (Phase 5) |
| 5 | Overspend via concurrent requests | `SELECT … FOR UPDATE` in stable order + post-check | Load test with parallel withdrawals (Phase 8) |
| 6 | Insider edits a balance | No balance-edit route (tested); immutable entries/audit via triggers; reversals need permission, reason, audit | Maker/checker approvals; DB role without UPDATE/DELETE grants |
| 7 | IDOR on wallets | Queries scoped by owner; foreign wallet returns 404 (tested) | Same pattern for cards/deposits |
| 8 | Privilege escalation | Server-side permission middleware; least-privilege seeds; staff cannot change own status | Admin MFA, IP allow-list, session timeout for staff |
| 9 | Sensitive data in logs | Audit metadata redacts password/otp/token/pan/cvv keys; OTP never logged | Log scrubbing at the collector; data classification doc |
| 10 | Webhook spoofing | Not yet exposed | Signature + timestamp + event-ID replay protection (Phase 5) |
| 11 | Card data exposure | No PAN/CVV fields exist anywhere | Issuer-hosted card display iframe (Phase 6) |
