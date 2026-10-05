function validationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

export function cleanString(value, field, { required = true, max = 250 } = {}) {
    if (value === undefined || value === null) {
        if (required) throw validationError(`${field} is required`);
        return undefined;
    }

    const cleaned = String(value).trim();

    if (required && !cleaned) throw validationError(`${field} is required`);
    if (cleaned.length > max) throw validationError(`${field} is too long`);

    return cleaned;
}

export function cleanEmail(value) {
    const email = cleanString(value, "Email", { max: 254 }).toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!valid) throw validationError("A valid email is required");
    return email;
}

export function cleanNumber(
    value,
    field,
    { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}
) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < min || number > max) {
        throw validationError(`${field} must be between ${min} and ${max}`);
    }

    return number;
}

export function cleanEnum(value, field, allowed) {
    if (!allowed.includes(value)) {
        throw validationError(`${field} must be one of: ${allowed.join(", ")}`);
    }

    return value;
}

export function cleanStringArray(value, field, allowed, { min = 0 } = {}) {
    if (!Array.isArray(value)) throw validationError(`${field} must be an array`);

    const cleaned = [...new Set(value.map((item) => String(item).trim()))];

    if (cleaned.length < min) throw validationError(`${field} is required`);
    if (cleaned.some((item) => !allowed.includes(item))) {
        throw validationError(`${field} contains an invalid value`);
    }

    return cleaned;
}

export function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
