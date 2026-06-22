"use strict";

const MemosDAO = require("../data/memos-dao").MemosDAO;
const { marked } = require("marked");

/*
 * TUNED variant of `main`. Same stored-XSS vulnerability and same
 * attacker-controlled source (req.body.memo), same lack of sanitization in
 * `marked`. The ONLY change: the unescaped HTML is now assembled in JavaScript
 * and emitted via res.send(), instead of being handed to res.render() and
 * unescaped inside views/memos.ejs (`<%- %>`).
 *
 * WHY: on `main` the dangerous sink lives in the EJS template, which Coverity's
 * JS taint engine does not parse into — so the req.body -> marked -> render
 * dataflow goes cold at res.render() and no finding is raised. Here the same
 * taint reaches an HTTP-response sink (res.send) entirely within analyzable JS,
 * to test whether the original miss was purely template opacity.
 */
function MemosHandler(db) {
    const memosDAO = new MemosDAO(db);

    this.addMemos = (req, res, next) => {
        memosDAO.insert(req.body.memo, (err, docs) => {
            if (err) return next(err);
            this.displayMemos(req, res, next);
        });
    };

    this.displayMemos = (req, res, next) => {
        const { userId } = req.session;

        memosDAO.getAllMemos((err, docs) => {
            if (err) return next(err);

            // Build the page HTML in JS. marked still does NOT sanitize, so raw
            // HTML in a stored memo flows straight through.
            const memoHtml = docs
                .map((doc) => `<div class="memo">${marked.parse(doc.memo || "")}` +
                              `<div class="date">${doc.date}</div></div>`)
                .join("");

            // SINK: unescaped, attacker-influenced HTML written to the HTTP
            // response in analyzable JS (no template indirection).
            const page = `<!DOCTYPE html><html><body>` +
                `<h1>Memos</h1><p>Logged in as: ${userId || "guest"}</p>` +
                `<form method="POST" action="/memos">` +
                `<textarea name="memo"></textarea><button>Add memo</button></form>` +
                `<h2>Your memos</h2>${memoHtml}</body></html>`;

            return res.send(page);
        });
    };
}

module.exports = MemosHandler;
