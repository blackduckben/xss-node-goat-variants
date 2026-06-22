# Tuning notes — `xss-template-literal-tuned`

Base branch: **`xss-template-literal`** (template-literal HTML → `innerHTML`).

## Why this branch exists

In the first Polaris/Coverity run, `xss-template-literal` produced **no HIGH
finding** — it matched the baseline (2 medium / 5 low from shared server-side
code). The hypothesis: the **source** — an in-page form field's `.value` — was
not treated as attacker-controlled, so the template-literal → `innerHTML` sink
never tripped the checker.

## What was tuned

Only the **source** changed; the **sink is identical** to the base branch.

| | Base (`xss-template-literal`) | Tuned (`xss-template-literal-tuned`) |
|---|---|---|
| Source | `document.getElementById("input").value` | `decodeURIComponent(location.hash.slice(1))` |
| Sink | template literal interpolation → `results.innerHTML` | same (unchanged) |
| Trigger | button click / Enter | `load` + `hashchange` |

## Exploit

```
index.html#<img src=x onerror=alert(document.domain)>
```

## Expected SAST outcome

If the source was the gap, this branch should now report a **HIGH** XSS
(source `location.hash` → template literal → `innerHTML`), unlike the base
branch. This also tests whether Coverity tracks taint *through* template-literal
string construction once the source is recognized.
