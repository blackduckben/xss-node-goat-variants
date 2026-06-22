# XSS case — `main-tuned` (server-side stored XSS, sink moved out of the template)

Tuned variant of **`main`**.

## The gap being probed

On `main`, Polaris/Coverity reported **High = 0** for a fully remote, stored,
high-severity XSS. Hypothesis: the miss is **template opacity** — the unescaped
sink lives in `views/memos.ejs` (`<%- memo.html %>`), and the JS taint engine
does not parse into the EJS template, so the dataflow goes cold at
`res.render()`.

This branch tests that hypothesis by moving the sink into analyzable JS.

## What was tuned

Everything about the vulnerability is the same except where the unescaped HTML
is emitted.

| | Base (`main`) | Tuned (`main-tuned`) |
|---|---|---|
| Source | `req.body.memo` (stored, then re-read) | same |
| Sanitization | none (`marked.parse`, raw HTML passes) | same |
| Sink | `res.render("memos")` -> `<%- %>` in `views/memos.ejs` | HTML built in JS -> `res.send(page)` |
| Analyzable by JS taint engine? | sink hidden in template | **yes — sink is in handlers/memos.js** |

## Exploit (unchanged in spirit)

```bash
curl -s -c jar -b jar -X POST http://localhost:3000/memos \
  --data-urlencode 'memo=<img src=x onerror=alert(document.domain)>'
curl -s -c jar -b jar http://localhost:3000/memos   # payload served unescaped
```

Stored: fires for every user who later loads `/memos`.

## Expected SAST outcome

- If the original miss was purely template opacity → this should now report a
  **HIGH** (req.body -> marked -> `res.send`), unlike `main`.
- If it still reports 0 → the gap is broader than templates (e.g. `marked`
  output treated as sanitized, or the stored round-trip through the DAO breaking
  taint).
