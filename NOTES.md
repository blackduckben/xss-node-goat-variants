# XSS case — `xss-url-context` (javascript: URL sink)

New case (branched from `main`), not a tuning of a prior branch.

## The gap being probed

Does the SAST engine flag a **URL-context** sink — assigning user input to an
`href`/`src` that can become a `javascript:` URI — as distinct from an HTML-body
sink? This is a different sink *class*: HTML-entity escaping (the usual XSS fix)
does nothing here, so analyzers that only model markup-injection sinks miss it.

## Flow

| Stage | Code |
|---|---|
| Source | `new URLSearchParams(location.search).get("next")` (recognized) |
| Sink | `link.href = next;` (URL context — `javascript:` executes on click) |

The source is one Coverity already recognizes, isolating the **URL-context sink**
as the novel element. Note there is no `innerHTML` here at all.

## Exploit

```
index.html?next=javascript:alert(document.domain)
```

Renders a "Continue →" link whose `href` runs script when clicked.

## Expected SAST outcome

- If the analyzer models `href`/URL sinks (CWE-79 via URI, sometimes flagged as
  open-redirect/`javascript:`-URI) → **HIGH/medium** above baseline.
- If it only tracks HTML-body sinks → no new finding, despite a real XSS — a
  meaningful gap, since `next`/`returnUrl`/`redirect` params are everywhere.
