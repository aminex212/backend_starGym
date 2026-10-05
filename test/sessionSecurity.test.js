import assert from "node:assert/strict";
import test from "node:test";

import {
    CSRF_COOKIE,
    SESSION_COOKIE,
    clearSession,
    createSession,
    verifyCsrfToken,
} from "../middleware/sessionSecurity.js";

test("session cookies keep the signed token out of JavaScript", () => {
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-tests";
    process.env.NODE_ENV = "test";
    delete process.env.COOKIE_SAME_SITE;

    const cookies = new Map();
    const response = {
        cookie(name, value, options) {
            cookies.set(name, { value, options });
        },
    };

    const csrfToken = createSession(response, {
        _id: "507f1f77bcf86cd799439011",
        role: "admin",
    });

    assert.equal(cookies.get(SESSION_COOKIE).options.httpOnly, true);
    assert.equal(cookies.get(CSRF_COOKIE).options.httpOnly, false);
    assert.equal(cookies.get(SESSION_COOKIE).options.sameSite, "lax");
    assert.equal(cookies.get(CSRF_COOKIE).value, csrfToken);
});

test("CSRF verification requires matching cookie and header values", () => {
    const token = "a".repeat(64);
    const request = {
        cookies: { [CSRF_COOKIE]: token },
        get(name) {
            return name === "x-csrf-token" ? token : undefined;
        },
    };

    assert.equal(verifyCsrfToken(request), true);
    request.get = () => "b".repeat(64);
    assert.equal(verifyCsrfToken(request), false);
});

test("logout clears both authentication cookies", () => {
    const cleared = [];
    const response = {
        clearCookie(name, options) {
            cleared.push({ name, options });
        },
    };

    clearSession(response);

    assert.deepEqual(
        cleared.map(({ name }) => name),
        [SESSION_COOKIE, CSRF_COOKIE]
    );
    assert.ok(cleared.every(({ options }) => options.path === "/"));
});
