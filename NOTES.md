# XSS case — `xss-fetch-response` (network-response sink)

New case (branched from `main`), not a tuning of a prior branch.

## The gap being probed

Does the SAST engine treat a **`fetch()`/XHR response body** as an untrusted
source? In real apps the JSON returned by your own API frequently contains
user-supplied, server-stored data (bios, display names, comments). Rendering a
field of it with `innerHTML` is XSS, but analyzers often assume "our own API =
trusted" and drop taint at the network boundary.

## Flow

| Stage | Code |
|---|---|
| Source | `fetch("/api/profile").then(res => res.json())` (response body) |
| Sink | `profile.innerHTML = "<h3>" + profile.name + "</h3><p>" + profile.bio + "</p>"` |

No `location.*` source is involved — that is the point. This isolates the
**network response** as the taint origin.

## Exploit

An API response such as:

```json
{ "name": "Mallory", "bio": "<img src=x onerror=alert(document.domain)>" }
```

(The static demo has no `/api/profile`; it falls back to a message. SAST is a
static analysis, so it evaluates the `innerHTML` data-flow regardless of whether
the endpoint exists at runtime.)

## Expected SAST outcome

- If response bodies are modeled as untrusted → **HIGH** above the baseline.
- If the analyzer trusts same-origin API responses → no new HIGH (a common and
  important blind spot, since stored XSS frequently arrives this way).
