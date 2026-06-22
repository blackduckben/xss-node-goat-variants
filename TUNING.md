# Tuning notes — `xss-event-handler-tuned`

Base branch: **`xss-event-handler`** (attribute-context injection → `innerHTML`).

## Why this branch exists

In the first Polaris/Coverity run, `xss-event-handler` produced **no HIGH
finding** — it matched the baseline (2 medium / 5 low from shared server-side
code). The hypothesis: the **source** — an in-page form field's `.value` — was
not treated as attacker-controlled, so the attribute-context sink never tripped
the checker.

## What was tuned

Only the **source** changed; the **sink is identical** to the base branch.

| | Base (`xss-event-handler`) | Tuned (`xss-event-handler-tuned`) |
|---|---|---|
| Source | `document.getElementById("input").value` | `decodeURIComponent(location.hash.slice(1))` |
| Sink | `` `<button title="${userText}">…` `` → `innerHTML` | same (unchanged) |
| Trigger | button click / Enter | `load` + `hashchange` |

## Exploit

Break out of the `title="..."` attribute and inject an event handler:

```
index.html#" onmouseover="alert(document.domain)
```

Renders as: `<button title="" onmouseover="alert(document.domain)">Custom Button</button>`

## Expected SAST outcome

If the source was the gap, this branch should now report a **HIGH** XSS
(source `location.hash` → attribute-context interpolation → `innerHTML`),
unlike the base branch.
