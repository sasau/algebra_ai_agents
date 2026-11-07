# HTTP behavior — specification to implement

Default origin: `http://127.0.0.1:8080`. Routes match `getRequestURI().getPath()`
exactly; JDK context-prefix matching alone is insufficient. Every text response
uses UTF-8 and `Content-Type: text/plain; charset=utf-8`. Compute Content-Length
from encoded bytes, never Java character count. Close every exchange and body
stream. A 204 response has no body (`sendResponseHeaders(204, -1)`).

| Method and path | Success response | Input and failure behavior |
|---|---|---|
| `GET /health` | 200, `OK\n` | No session lookup or cookie. |
| `GET /hello` | 200, `Hello, world!\n` | Optional `name` query parameter. |
| `GET /hello?name=Ada` | 200, `Hello, Ada!\n` | Decode percent encoding and `+` as space using UTF-8. |
| `POST /echo` | 200, exactly the received bytes | At most 4096 bytes; 413 on byte 4097. |
| `GET /session` | 200, `visits=N\n` | Creates/reuses a session, then counts this visit. |
| `DELETE /session` | 204, empty | Invalidates a known session; also succeeds if missing/unknown. |

In this document `\n` denotes one LF newline, rather than a literal backslash followed by n.
The echo body is opaque bytes: do not decode it or require JSON. The response
uses `application/octet-stream`. Read at most 4097 bytes (limit + 1), including
when Content-Length is absent or untrusted. Reject oversized content with 413;
never read the rest into memory merely to prove it is oversized.

For hello: absent `name` means `world`; blank/whitespace, duplicate `name`,
malformed percent encoding or a decoded name longer than 80 Unicode code points
means 400. Ignore other well-formed query parameters. Test an encoded Unicode
name and spaces. Catch decoding failures as 400; a malformed raw URI may be
rejected by the JDK before application routing and is not a promised body format.

Unknown paths, including `/health/extra`, produce 404. A known path with an
unsupported method produces 405 and `Allow` listing that path's supported
methods (GET; POST; or GET, DELETE). HEAD is not a supplied route; its error
response has no body as required by HTTP. Errors use short fixed text lines:
`Bad request\n`, `Not found\n`, `Method not allowed\n`, `Payload too large\n`,
`Busy\n`, `Session capacity reached\n`, `Internal server error\n`.
The respective status codes are 400, 404, 405, 413, 503, 503 and 500.

## Cookie sessions

The only session cookie is `J03SID`. Create an opaque, cryptographically random
ID with at least 128 bits of entropy; never use client input as a new store key.
On creation send `Set-Cookie: J03SID=<id>; Path=/; HttpOnly; SameSite=Lax`.
The loopback demo uses HTTP, so Secure is omitted here; a deployed version would
require HTTPS and an appropriate Secure policy. A session is a visit counter,
not proof of a person's identity or a complete authentication mechanism.

Parse semicolon-separated Cookie pairs across all Cookie headers. Match the
cookie name exactly, not by substring. Reject malformed/duplicate J03SID values
as unusable: GET creates a new server-generated ID, DELETE only clears the
cookie. IDs use a specified URL-safe alphabet and fixed length; ignore unrelated
cookies. Missing, forged, expired or deleted IDs must never be reinserted under
the supplied value. Do not create sessions for health, hello or echo.

The first session visit returns `visits=1\n`. Reuse returns 2, 3, and so on.
Only creation or replacement needs Set-Cookie. DELETE always sends
`J03SID=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, even for an unknown ID.
Replaying the old cookie starts a fresh session with count 1 and a different ID.

Expiry is **absolute**: 30 minutes after creation, including the exact boundary;
requests do not extend it. Default capacity is 1000 active sessions. Remove
expired entries on store operations before enforcing capacity. If full, creation
fails with 503; existing live sessions still work. No background sweeper is
required. Concurrency with DELETE is linearized: a visit ordered before delete
may complete; visits ordered after it cannot revive that ID.
