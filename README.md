# xss-nodegoat

Collection of **XSS vulnerabilities** in various contexts—from stored XSS in Express/marked to
DOM-based, reflected, and cross-frame messaging attacks. Each permutation is a separate branch
for SAST tool testing.

## Branches (XSS Permutations)

Each branch demonstrates a realistic XSS pattern that could reach production code. Use them
to test whether your SAST tool detects each one.

### **main** — Stored XSS (Express + marked)
**File:** `server.js`, `handlers/memos.js`, `views/memos.ejs`

A backend that stores user memos (via `marked.parse()`) and renders them unescaped to HTML
via an EJS template. Mirrors the original OWASP NodeGoat memos vulnerability.

```bash
# Run the server
npm install && npm start
# POST http://localhost:3000/memos with memo: <img src=x onerror=alert(document.domain)>
```

**Payload:** `<img src=x onerror=alert(document.domain)>`

---

### **xssinjs** — Direct DOM-based XSS
**File:** `index.html` (plain HTML + vanilla JS)

Pure client-side vulnerability: `element.innerHTML = userInput` with no sanitization.

**Payload:** `<img src=x onerror=alert('XSS')>`

---

### **xss-jquery** — jQuery .html() XSS
**File:** `index.html` (jQuery + vanilla JS)

Using jQuery's `.html()` method to inject unsanitized user input. More subtle than direct
`innerHTML` — some SAST tools may miss it since the taint flows through a library method.

**Payload:** `<img src=x onerror=alert('jQuery XSS')>`

---

### **xss-template-literal** — Template Literal XSS
**File:** `index.html` (template strings + vanilla JS)

HTML built via backtick template literals with string interpolation, then injected via
`innerHTML`. Harder for SAST to trace since the HTML construction is spread across
template syntax.

**Payload:** `<img src=x onerror=alert('Template XSS')>`

---

### **xss-event-handler** — Event Attribute Injection
**File:** `index.html` (attribute context injection)

Unsanitized input in an HTML attribute context (e.g., `title="..."`), breaking the
attribute boundary and injecting event handlers.

**Payload:** `" onmouseover="alert('XSS')`

---

### **xss-url-param** — Reflected XSS (Query Parameter)
**File:** `index.html` (URLSearchParams + innerHTML)

Reading from `location.search` via `URLSearchParams` and rendering to DOM without escaping.
Classic reflected XSS — attacker crafts a malicious URL and sends it to a victim.

**Payload:** `?name=<img src=x onerror=alert('Reflected XSS')>`

---

### **xss-postmessage** — postMessage XSS
**File:** `index.html` (cross-window messaging)

A `message` event listener that renders untrusted data to DOM without validating the
origin. Can be exploited by any frame/window that communicates with this page.

**Payload (in browser console):** `window.postMessage("<img src=x onerror=alert('postMessage XSS')>", "*")`

---

## How to use for SAST testing

Checkout each branch and run your SAST tool:

```bash
git checkout xss-jquery
# Run your SAST scanner
your-sast-tool scan .
```

### Expected findings

Each branch **should** trigger a high-severity XSS finding. If your SAST tool misses one,
that's a gap worth investigating—some tools struggle with:

- **Library methods** (jQuery, Lodash) that indirectly inject HTML
- **Template literal** HTML construction (complex dataflow)
- **Attribute context** injection (boundary-breaking payloads)
- **URL parameter** taint (from `URLSearchParams`, not direct `?` parsing)
- **postMessage** handlers (cross-frame threat model)

## How to fix

Generic remediation for all variants:

1. **Escape user input** before rendering: Use `.textContent` instead of `.innerHTML`, or
   HTML-escape all interpolated values.
2. **Use context-aware libraries**: Templating engines (Handlebars, EJS, Nunjucks) with
   escaping enabled by default.
3. **Sanitize on output**: For rich HTML, use [`DOMPurify`](https://github.com/cure53/DOMPurify)
   or similar.
4. **Validate and whitelist**: Especially for URLs and postMessage origins.

Example fix (all branches):

```js
// BAD
element.innerHTML = userInput;

// GOOD
element.textContent = userInput;
// or
element.innerHTML = DOMPurify.sanitize(userInput);
```
