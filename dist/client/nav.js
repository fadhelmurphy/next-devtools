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
        const m = seg.match(/^\[{1,2}(?:\.\.\.)?([^\]]+)\]{1,2}$/);
        if (!m)
            return seg;
        const v = (values[m[1]] ?? "").trim();
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
    const router = window.next?.router;
    if (router && typeof router.push === "function") {
        try {
            router.push(url);
            return;
        }
        catch { }
    }
    window.location.assign(url);
}
