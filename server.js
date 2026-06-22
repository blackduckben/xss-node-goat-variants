"use strict";

const path = require("path");
const express = require("express");
const session = require("express-session");
const MemosHandler = require("./handlers/memos");
const { MemosDAO } = require("./data/memos-dao");

const app = express();
const port = process.env.PORT || 3000;

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body parsing + a minimal session so req.session.userId exists (as in NodeGoat)
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "xss-nodegoat-demo",
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    if (!req.session.userId) req.session.userId = "demo-user";
    next();
});

// No real DB needed; the in-memory DAO ignores this argument.
const memos = new MemosHandler(null);

app.get("/", (req, res) => res.redirect("/memos"));
app.get("/memos", memos.displayMemos);
app.post("/memos", memos.addMemos);

// Memo search. VULNERABILITY (SQL injection): req.query.author is an
// attacker-controlled HTTP parameter passed straight into a concatenated SQL
// query in MemosDAO.searchByAuthor (data/memos-dao.js). Try:
//   GET /memos/search?author=' OR '1'='1
const memosDao = new MemosDAO(null);
app.get("/memos/search", (req, res) => {
    memosDao.searchByAuthor(req.query.author, (err, rows) => {
        if (err) return res.status(500).send("query error");
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`xss-nodegoat listening on http://localhost:${port}/memos`);
});
