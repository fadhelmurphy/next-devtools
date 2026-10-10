/** Make arbitrary runtime values safe for <JsonTree>: functions, elements, promises, cycles. */
export function serializable(value, depth = 0, seen = new WeakSet()) {
    var _a, _b;
    if (value === null || value === undefined)
        return value === null ? null : "undefined";
    const t = typeof value;
    if (t === "function")
        return `ƒ ${value.name || "anonymous"}()`;
    if (t === "symbol" || t === "bigint")
        return String(value);
    if (t !== "object")
        return value;
    const obj = value;
    if (seen.has(obj))
        return "[Circular]";
    seen.add(obj);
    if (obj.$$typeof)
        return `<${typeof obj.type === "string" ? obj.type : ((_a = obj.type) === null || _a === void 0 ? void 0 : _a.displayName) || ((_b = obj.type) === null || _b === void 0 ? void 0 : _b.name) || "Component"} />`;
    if (typeof obj.then === "function")
        return obj.status === "fulfilled" ? serializable(obj.value, depth + 1, seen) : "Promise";
    if (typeof Element !== "undefined" && obj instanceof Element)
        return `<${obj.tagName.toLowerCase()}>`;
    if (obj instanceof Date)
        return obj.toISOString();
    if (obj instanceof Map)
        return Object.fromEntries([...obj].map(([k, v]) => [String(k), serializable(v, depth + 1, seen)]));
    if (obj instanceof Set)
        return [...obj].map((v) => serializable(v, depth + 1, seen));
    if (depth > 6)
        return Array.isArray(obj) ? `Array(${obj.length})` : "{…}";
    if (Array.isArray(obj))
        return obj.map((v) => serializable(v, depth + 1, seen));
    const out = {};
    for (const k of Object.keys(obj))
        out[k] = serializable(obj[k], depth + 1, seen);
    return out;
}
