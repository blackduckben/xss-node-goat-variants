# xss-nodegoat

Minimal Express + [`marked`](https://github.com/markedjs/marked) "hello world" that reproduces
the **stored XSS** in the OWASP NodeGoat *memos* feature.

## Run

```bash
npm install
npm start
# open http://localhost:3000/memos
```

## The vulnerability

Mirrors the original NodeGoat handler (`addMemos` stores `req.body.memo`,
`displayMemos` reads them all back and renders the `memos` view). The twist
is that `marked` converts the stored markdown to HTML for display:

- `marked` does **not** sanitize — raw HTML in the input passes straight through.
- The template injects that HTML with EJS's **unescaped** output tag (`<%- %>`).

So a memo body of:

```
<img src=x onerror=alert(document.domain)>
```

is stored verbatim and rendered as live markup. It executes for every user who
later views `/memos`.

### Proof

```bash
curl -s -c jar -b jar -X POST http://localhost:3000/memos \
  --data-urlencode 'memo=<img src=x onerror=alert(document.domain)>'
curl -s -c jar -b jar http://localhost:3000/memos | grep onerror
#   -> <img src=x onerror=alert(document.domain)>   (unescaped = XSS)
```

## How to fix

Pick one (defense in depth = do both):

1. **Sanitize the HTML** that `marked` produces, e.g. with
   [`dompurify`](https://github.com/cure53/DOMPurify):

   ```js
   const createDOMPurify = require("dompurify");
   const { JSDOM } = require("jsdom");
   const DOMPurify = createDOMPurify(new JSDOM("").window);
   const html = DOMPurify.sanitize(marked.parse(doc.memo || ""));
   ```

2. **Don't render arbitrary HTML at all.** If memos should be plain text,
   escape with the EJS `<%= %>` tag instead of `<%- %>`, and/or render markdown
   with raw-HTML disabled.

## Files

- `server.js` — Express app, session, routes
- `handlers/memos.js` — the vulnerable handler (`marked.parse`, no sanitizer)
- `data/memos-dao.js` — in-memory store (stand-in for the Mongo DAO)
- `views/memos.ejs` — template that injects memo HTML unescaped
