# XSS case — `xss-localstorage` (storage round-trip / "stored DOM XSS")

New case (branched from `main`), not a tuning of a prior branch.

## The gap being probed

Does the SAST engine track taint **across a persistence boundary** — i.e. a
value written to `localStorage` from an untrusted source, then read back on a
later load and sent to a sink? Many analyzers reset taint at `setItem`/`getItem`
because storage looks like trusted local state.

## Flow

| Stage | Code |
|---|---|
| Source | `decodeURIComponent(location.hash.slice(1))` (recognized) |
| Write boundary | `localStorage.setItem("displayName", incoming)` |
| Read boundary | `localStorage.getItem("displayName")` |
| Sink | `greeting.innerHTML = "Welcome back, " + name + "!"` |

The source is deliberately one Coverity already recognizes (`location.hash`), so
this isolates the **storage round-trip** as the only novel element vs. the
confirmed-detectable `xssinjs-tuned` case.

## Exploit

1. Visit `index.html#<img src=x onerror=alert(document.domain)>` (writes to storage).
2. Reload `index.html` with no fragment — payload fires from the stored value.

## Expected SAST outcome

- If taint survives the round-trip → **HIGH** (1 above the 2 med / 5 low baseline).
- If the analyzer drops taint at the storage boundary → no new HIGH (a real-world
  blind spot worth recording).
