"use strict";

/*
 * Minimal in-memory stand-in for the NodeGoat MemosDAO.
 * The real one talks to MongoDB; here an array is enough to demonstrate
 * that whatever the user submits is stored verbatim and read back verbatim.
 */
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
}

module.exports = { MemosDAO };
