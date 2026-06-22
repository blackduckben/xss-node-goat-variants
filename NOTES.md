# XSS case — `main-test-a` (reflected, no DAO, no marked)

Isolating experiment, branched from `main`. Paired with `main-test-b`.

## Question

`main` and `main-tuned` both reported **High = 0** for a stored XSS. Two suspects
remain: (1) the DAO store/retrieve round-trip breaks taint, (2) `marked.parse()`
is modeled as a sanitizer. This branch removes **both** to establish a floor.

## Flow

| Stage | Code |
|---|---|
| Source | `req.body.memo` (recognized) |
| Storage | none (removed) |
| Transform | none (no `marked`) |
| Sink | `` res.send(`…<div class="memo">${req.body.memo}</div>…`) `` |

## Exploit

```bash
curl -s -X POST http://localhost:3000/memos \
  --data-urlencode 'memo=<img src=x onerror=alert(document.domain)>'
# reflected straight back, unescaped
```

## Expected outcome / how to read it

- **HIGH** → the engine catches the most direct reflected `req -> res.send`. The
  `main`/`main-tuned` misses are therefore caused by what this branch removed
  (the DAO round-trip and/or marked). Compare with `main-test-b` to separate them.
- **0** → even a direct reflected response sink is missed: the gap is much
  broader than storage/marked/templates.
