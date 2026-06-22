# Tuning notes — `xss-jquery-tuned`

Base branch: **`xss-jquery`** (jQuery `.html()` DOM XSS).

## Why this branch exists

In the first Polaris/Coverity run, `xss-jquery` produced **no HIGH finding** —
it matched the baseline (2 medium / 5 low from shared server-side code). The
hypothesis: the **source** — an in-page form field's `.value` — was not treated
as attacker-controlled, so the `.html()` sink alone never tripped the checker.

## What was tuned

Only the **source** changed; the **sink is identical** to the base branch.

| | Base (`xss-jquery`) | Tuned (`xss-jquery-tuned`) |
|---|---|---|
| Source | `document.getElementById("input").value` | `decodeURIComponent(location.hash.slice(1))` |
| Sink | `$("#comments").html(userComment)` | `$("#comments").html(userComment)` (unchanged) |
| Trigger | button click / Enter | `load` + `hashchange` |

## Exploit

```
index.html#<img src=x onerror=alert(document.domain)>
```

## Expected SAST outcome

If the source was the gap, this branch should now report a **HIGH** XSS
(source `location.hash` → sink jQuery `.html()`), unlike the base branch.
