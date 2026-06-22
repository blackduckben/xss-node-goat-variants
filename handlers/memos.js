"use strict";

/*
 * TEST A — isolating experiment (branched from `main`).
 *
 * Strips BOTH the DAO store/retrieve round-trip AND `marked`. The posted value
 * flows directly: req.body.memo -> res.send(). This is the most direct possible
 * reflected source -> sink in analyzable JS.
 *
 * Purpose: establish a floor. If Coverity does NOT flag even this, the gap is
 * far broader than templates, storage, or marked. If it DOES flag, then the
 * misses on `main`/`main-tuned` are caused by something this branch removed
 * (the DAO round-trip and/or marked) — Test B then separates those two.
 *
 * See NOTES.md.
 */
function MemosHandler(db) {

    this.addMemos = (req, res) => {
        // SINK: attacker-controlled req.body.memo concatenated straight into the
        // HTTP response, no sanitization, no storage, no template.
        const page = `<!DOCTYPE html><html><body>` +
            `<h1>Memos</h1><p>You posted:</p>` +
            `<div class="memo">${req.body.memo}</div>` +
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
