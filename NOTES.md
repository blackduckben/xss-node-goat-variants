# XSS case — `main-test-b` (reflected through marked, no DAO)

Isolating experiment, branched from `main`. Paired with `main-test-a`.

## Question

Same as Test A but with `marked.parse()` kept in the path. The DAO round-trip is
removed in both, so the ONLY difference between A and B is `marked`. This pins
down whether `marked.parse()` is being treated as a sanitizer.

## Flow

| Stage | Code |
|---|---|
| Source | `req.body.memo` (recognized) |
| Storage | none (removed) |
| Transform | `marked.parse(req.body.memo)` (no sanitization in reality) |
| Sink | `` res.send(`…${marked.parse(req.body.memo)}…`) `` |

## Exploit

```bash
curl -s -X POST http://localhost:3000/memos \
  --data-urlencode 'memo=<img src=x onerror=alert(document.domain)>'
# marked passes the raw <img> through; reflected unescaped
```

## How to read it (against `main-test-a`)

| Test A (no marked) | Test B (marked) | Conclusion |
|---|---|---|
| HIGH | **0** | `marked.parse()` modeled as a sanitizer → kills taint |
| HIGH | HIGH | `marked` transparent → the DAO round-trip breaks taint on `main`/`main-tuned` |
| 0 | 0 | even a direct reflected `res.send` is missed → gap broader than all of the above |
