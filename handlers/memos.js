"use strict";

const { marked } = require("marked");

/*
 * TEST B — isolating experiment (branched from `main`). Paired with main-test-a.
 *
 * Removes the DAO store/retrieve round-trip but KEEPS `marked`. The posted value
 * flows: req.body.memo -> marked.parse() -> res.send(). The only difference from
 * Test A is the `marked.parse()` call.
 *
 * Purpose: separate the two remaining suspects behind the main/main-tuned misses.
 *   - If Test A is HIGH and Test B is 0  -> `marked.parse()` is treated as a
 *     sanitizer (its output is considered safe), killing the taint.
 *   - If Test B is also HIGH             -> `marked` is transparent to the engine,
 *     so the DAO round-trip is what breaks taint on `main`/`main-tuned`.
 *
 * See NOTES.md.
 */
function MemosHandler(db) {

    this.addMemos = (req, res) => {
        // marked does NOT sanitize: raw HTML in req.body.memo passes through.
        // SINK: result concatenated straight into the HTTP response. No storage.
        const page = `<!DOCTYPE html><html><body>` +
            `<h1>Memos</h1><p>You posted:</p>` +
            `<div class="memo">${marked.parse(req.body.memo || "")}</div>` +
            `<form method="POST" action="/memos">` +
            `<textarea name="memo"></textarea><button>Add memo</button></form>` +
            `</body></html>`;
        res.send(page);
    };

    this.displayMemos = (req, res) => {
        res.send(`<!DOCTYPE html><html><body><h1>Memos</h1>` +
            `<form method="POST" action="/memos">` +
            `<textarea name="memo"></textarea><button>Add memo</button></form>` +
            `</body></html>`);
    };
}

module.exports = MemosHandler;
