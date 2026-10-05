import crypto from "crypto";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "stargym_session";
export const CSRF_COOKIE = "stargym_csrf";

const oneDay = 24 * 60 * 60 * 1000;

function cookieOptions({ httpOnly }) {
    const production = process.env.NODE_ENV === "production";
    const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
    const sameSite = ["lax", "strict", "none"].includes(configuredSameSite)
        ? configuredSameSite
        : production
          ? "none"
          : "lax";

    return {
        httpOnly,
        secure: production || sameSite === "none",
        sameSite,
        path: "/",
        maxAge: oneDay,
    };
}

export function createSession(res, user) {
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    const csrfToken = crypto.randomBytes(32).toString("hex");

    res.cookie(SESSION_COOKIE, token, cookieOptions({ httpOnly: true }));
    res.cookie(CSRF_COOKIE, csrfToken, cookieOptions({ httpOnly: false }));

    return csrfToken;
}

export function clearSession(res) {
    const sessionOptions = cookieOptions({ httpOnly: true });
    const csrfOptions = cookieOptions({ httpOnly: false });

    delete sessionOptions.maxAge;
    delete csrfOptions.maxAge;

    res.clearCookie(SESSION_COOKIE, sessionOptions);
    res.clearCookie(CSRF_COOKIE, csrfOptions);
}

export function ensureCsrfToken(req, res) {
    const existing = req.cookies?.[CSRF_COOKIE];

    if (existing) {
        return existing;
    }

    const csrfToken = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, csrfToken, cookieOptions({ httpOnly: false }));
    return csrfToken;
}

export function verifyCsrfToken(req) {
    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.get("x-csrf-token");

    if (!cookieToken || !headerToken) {
        return false;
    }

    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);

    return (
        cookieBuffer.length === headerBuffer.length &&
        crypto.timingSafeEqual(cookieBuffer, headerBuffer)
    );
}
