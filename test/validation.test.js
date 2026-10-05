import test from "node:test";
import assert from "node:assert/strict";
import {
    cleanEmail,
    cleanEnum,
    cleanNumber,
    cleanString,
    cleanStringArray,
    escapeHtml,
} from "../utils/validation.js";

test("validation normalizes safe values", () => {
    assert.equal(cleanString("  Star Gym  ", "Name"), "Star Gym");
    assert.equal(cleanEmail(" ADMIN@EXAMPLE.COM "), "admin@example.com");
    assert.equal(cleanNumber("42", "Age", { min: 1, max: 100 }), 42);
    assert.equal(cleanEnum("Paid", "Status", ["Paid", "Unpaid"]), "Paid");
    assert.deepEqual(
        cleanStringArray(["MMA", "MMA", "Boxing"], "Disciplines", ["MMA", "Boxing"]),
        ["MMA", "Boxing"]
    );
});

test("validation rejects malformed values", () => {
    assert.throws(() => cleanEmail("not-an-email"));
    assert.throws(() => cleanNumber(0, "Age", { min: 5, max: 100 }));
    assert.throws(() => cleanEnum("Maybe", "Status", ["Paid", "Unpaid"]));
});

test("email content is HTML escaped", () => {
    assert.equal(
        escapeHtml('<script>alert("x")</script>'),
        "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
});
