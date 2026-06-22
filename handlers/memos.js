"use strict";

const MemosDAO = require("../data/memos-dao").MemosDAO;
const { marked } = require("marked");

/*
 * Faithful to the NodeGoat handler you provided: addMemos stores the raw
 * req.body.memo, then displayMemos reads them all back and renders the
 * "memos" view. The only addition is `marked` turning the stored markdown
 * into HTML for display.
 *
 * THE VULNERABILITY: marked does NOT sanitize. Raw HTML in the input
 * (e.g. <img src=x onerror=alert(1)>) is passed straight through into the
 * rendered output, and the template injects it unescaped -> stored XSS.
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

            // Render each stored memo's markdown to HTML. No sanitizer.
            const memosList = docs.map((doc) => ({
                date: doc.date,
                html: marked.parse(doc.memo || "")
            }));

            return res.render("memos", { memosList, userId });
        });
    };
}

module.exports = MemosHandler;
