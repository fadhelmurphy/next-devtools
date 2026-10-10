function patternToRegex(route) {
    if (route === "/")
        return /^\/?$/;
    let re = "^";
    for (const seg of route.split("/").filter(Boolean)) {
        if (/^\[\[\.\.\..+\]\]$/.test(seg))
            re += "(?:/.*)?";
        else if (/^\[\.\.\..+\]$/.test(seg))
            re += "/.+";
        else if (/^\[.+\]$/.test(seg))
            re += "/[^/]+";
        else
            re += "/" + seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    return new RegExp(re + "/?$");
}
const specificity = (r) => (r.optionalCatchAll ? 3 : r.catchAll ? 2 : r.params.length ? 1 : 0);
/** The page route serving `pathname`, preferring static over dynamic like Next does. */
export function matchRoute(routes, pathname) {
    const candidates = routes.filter((r) => r.kind === "page" && !r.slot && !r.intercepting && patternToRegex(r.route).test(pathname));
    return candidates.sort((a, b) => specificity(a) - specificity(b) || b.route.length - a.route.length)[0];
}
export function fillRoute(route, values) {
    const url = route
        .split("/")
        .map((seg) => {
        var _a;
        const m = seg.match(/^\[{1,2}(?:\.\.\.)?([^\]]+)\]{1,2}$/);
        if (!m)
            return seg;
        const v = ((_a = values[m[1]]) !== null && _a !== void 0 ? _a : "").trim();
        return v
            .split("/")
            .filter(Boolean)
            .map(encodeURIComponent)
            .join("/");
    })
        .filter((seg, i) => i === 0 || seg !== "")
        .join("/");
    return url || "/";
}
/** Client-side navigation through Next's router when it's exposed, else a full load. */
export function navigate(url) {
    var _a;
    const router = (_a = window.next) === null || _a === void 0 ? void 0 : _a.router;
    if (router && typeof router.push === "function") {
        try {
            router.push(url);
            return;
        }
        catch (_b) { }
    }
    window.location.assign(url);
}
/** Extract dynamic params of `route` from `pathname`, e.g. /blog/[slug] + /blog/hi → { slug: "hi" }. */
export function extractParams(route, pathname) {
    const segs = route.split("/").filter(Boolean);
    const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const out = {};
    for (let i = 0; i < segs.length; i++) {
        const m = segs[i].match(/^\[{1,2}(\.\.\.)?([^\]]+)\]{1,2}$/);
        if (!m)
            continue;
        if (m[1]) {
            out[m[2]] = parts.slice(i);
            break;
        }
        out[m[2]] = parts[i];
    }
    return out;
}
