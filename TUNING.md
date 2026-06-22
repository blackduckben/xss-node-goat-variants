# Tuning notes — `xssinjs-tuned`

Base branch: **`xssinjs`** (direct `innerHTML` DOM XSS).

## Why this branch exists

In the first Polaris/Coverity run, `xssinjs` produced **no HIGH finding** — it
matched the no-`index.html` baseline (2 medium / 5 low from the shared
server-side code). The hypothesis: Coverity's taint analysis did not treat the
**source** — an in-page form field's `.value` — as attacker-controlled, so the
`innerHTML` sink alone never tripped the XSS checker.

## What was tuned

Only the **source** changed; the **sink is identical** to the base branch.

| | Base (`xssinjs`) | Tuned (`xssinjs-tuned`) |
|---|---|---|
| Source | `document.getElementById("input").value` | `decodeURIComponent(location.hash.slice(1))` |
| Sink | `output.innerHTML = userInput` | `output.innerHTML = userInput` (unchanged) |
| Trigger | button click / Enter | `load` + `hashchange` |

`location.hash` is a documented DOM-XSS source (part of `window.location`).
Routing it into the unchanged `innerHTML` sink tests whether a *recognized
source* is what flips the finding to HIGH.

## Exploit

Append a fragment to the URL:

```
index.html#<img src=x onerror=alert(document.domain)>
```

## Expected SAST outcome

If the source was the gap, this branch should now report a **HIGH** XSS
(source `location.hash` → sink `innerHTML`), unlike the base branch.
