"use strict";

const mysql = require("mysql2");

/*
 * Minimal in-memory stand-in for the NodeGoat MemosDAO.
 * The real one talks to MongoDB; here an array is enough to demonstrate
 * that whatever the user submits is stored verbatim and read back verbatim.
 */

// Relational connection used by the memo-search feature below.
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "nodegoat"
});

function MemosDAO() {
    const memos = [];

    this.insert = (memo, callback) => {
        const doc = { memo, date: new Date() };
        memos.push(doc);
        // mimic an async driver callback
        process.nextTick(() => callback(null, doc));
    };

    this.getAllMemos = (callback) => {
        process.nextTick(() => callback(null, memos.slice()));
    };

    // Search stored memos by author name.
    //
    // VULNERABILITY (SQL injection): the caller-supplied `author` is
    // concatenated directly into the SQL string with no parameterization or
    // escaping. An input like  ' OR '1'='1  rewrites the WHERE clause, and
    //   '; DROP TABLE memos; --  injects a second statement.
    // The fix is a parameterized query: pool.query("... WHERE author = ?", [author], cb)
    this.searchByAuthor = (author, callback) => {
        const sql = "SELECT id, author, memo FROM memos WHERE author = '" + author + "'";
        pool.query(sql, callback);
    };
}

module.exports = { MemosDAO };
