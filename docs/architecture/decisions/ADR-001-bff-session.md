# ADR-001: Backend-for-frontend with httpOnly session cookie

**Status:** accepted (milestone 1)

**Context.** README §7 specifies Next.js + Laravel. Storing an API token in `localStorage` exposes
it to any XSS. Laravel Sanctum SPA cookie auth needs both apps on one parent domain and CSRF dance.

**Decision.** Next.js route handlers act as a BFF. Login/register responses from Laravel are
intercepted server-side; the token is written to an httpOnly, Secure, SameSite=Strict cookie and
stripped from the JSON. All browser API calls go to `/api/bff/*`, which attaches the token.

**Consequences.** Token never reaches JS. CORS on Laravel is restricted to the web origin.
One extra hop per request (same region — negligible). Mobile apps later will use Sanctum tokens
directly with secure device storage.
