/* Records the page's fetch / XHR traffic and client navigations while
   DevTools is mounted (dev only). Wraps, never replaces, behaviour: the
   original call always runs and its result is returned untouched. */
import { API_ORIGIN } from "./api.js";
const MAX_ENTRIES = 300;
const MAX_BODY = 64 * 1024;
let entries = [];
let nextId = 1;
const listeners = new Set();
let installed = false;
const emit = () => listeners.forEach((l) => l());
export const getEntries = () => entries;
export function clearEntries() {
    entries = [];
    emit();
}
export function subscribeNetwork(fn) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
}
function push(e) {
    entries = [...entries.slice(-(MAX_ENTRIES - 1)), e];
    emit();
}
function update(id, patch) {
    entries = entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
    emit();
}
const headersToObject = (h) => {
    const out = {};
    if (!h)
        return out;
    new Headers(h).forEach((v, k) => (out[k] = v));
    return out;
};
export function classify(url, headers) {
    let u;
    try {
        u = new URL(url, location.href);
    }
    catch {
        return "fetch";
    }
    if (headers["next-action"])
        return "action";
    if (headers["rsc"] === "1" || u.searchParams.has("_rsc"))
        return "rsc";
    if (u.origin !== location.origin)
        return "external";
    if (u.pathname.startsWith("/_next/") || u.pathname.startsWith("/__nextjs"))
        return "next";
    if (u.pathname.startsWith("/api/"))
        return "api";
    return "fetch";
}
const isText = (ct) => !!ct && /json|text\/(plain|html|csv)|xml|javascript/.test(ct) && !/x-component/.test(ct);
function bodyToString(body) {
    if (body == null)
        return undefined;
    if (typeof body === "string")
        return body.slice(0, MAX_BODY);
    if (body instanceof URLSearchParams)
        return body.toString();
    if (typeof FormData !== "undefined" && body instanceof FormData) {
        const parts = [];
        body.forEach((v, k) => parts.push(`${k}=${typeof v === "string" ? v : `[File ${v.name}]`}`));
        return parts.join("&");
    }
    return `[${body.constructor?.name ?? "binary"}]`;
}
export function installNetworkRecorder() {
    if (installed || typeof window === "undefined")
        return;
    installed = true;
    const origFetch = window.fetch;
    window.fetch = async function (input, init) {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (API_ORIGIN && url.startsWith(API_ORIGIN))
            return origFetch.call(this, input, init);
        const reqHeaders = { ...headersToObject(input instanceof Request ? input.headers : undefined), ...headersToObject(init?.headers) };
        const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
        const id = nextId++;
        const start = performance.now();
        push({
            id,
            kind: classify(url, reqHeaders),
            method,
            url,
            start,
            requestHeaders: reqHeaders,
            requestBody: bodyToString(init?.body),
            action: reqHeaders["next-action"],
        });
        try {
            const res = await origFetch.call(this, input, init);
            const ct = res.headers.get("content-type");
            const len = Number(res.headers.get("content-length")) || undefined;
            update(id, {
                status: res.status,
                duration: performance.now() - start,
                contentType: ct ?? undefined,
                size: len,
                responseHeaders: headersToObject(res.headers),
            });
            if (isText(ct) && (!len || len <= MAX_BODY)) {
                res
                    .clone()
                    .text()
                    .then((t) => update(id, { responseBody: t.slice(0, MAX_BODY), size: len ?? t.length }))
                    .catch(() => { });
            }
            return res;
        }
        catch (err) {
            update(id, { error: String(err?.message ?? err), duration: performance.now() - start });
            throw err;
        }
    };
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    const setHeader = XHR.setRequestHeader;
    XHR.open = function (method, url, ...rest) {
        this.__nd = { method: method.toUpperCase(), url: String(url), headers: {} };
        return open.call(this, method, url, ...rest);
    };
    XHR.setRequestHeader = function (k, v) {
        if (this.__nd)
            this.__nd.headers[k.toLowerCase()] = v;
        return setHeader.call(this, k, v);
    };
    XHR.send = function (body) {
        const meta = this.__nd;
        if (meta && !(API_ORIGIN && meta.url.startsWith(API_ORIGIN))) {
            const id = nextId++;
            const start = performance.now();
            push({ id, kind: classify(meta.url, meta.headers), method: meta.method, url: meta.url, start, requestHeaders: meta.headers, requestBody: bodyToString(body) });
            this.addEventListener("loadend", () => {
                const ct = this.getResponseHeader("content-type");
                let text;
                try {
                    text = isText(ct) && (this.responseType === "" || this.responseType === "text") ? String(this.responseText).slice(0, MAX_BODY) : undefined;
                }
                catch { }
                update(id, {
                    status: this.status || undefined,
                    error: this.status ? undefined : "Network error",
                    duration: performance.now() - start,
                    contentType: ct ?? undefined,
                    responseBody: text,
                    size: text?.length,
                });
            });
        }
        return send.call(this, body);
    };
    // Client-side navigations (both routers use the History API)
    let lastPath = location.pathname + location.search;
    const nav = (how) => {
        const now = location.pathname + location.search;
        if (now === lastPath)
            return;
        push({ id: nextId++, kind: "navigation", method: how, url: now, start: performance.now(), requestHeaders: { from: lastPath } });
        lastPath = now;
    };
    for (const fn of ["pushState", "replaceState"]) {
        const orig = history[fn];
        history[fn] = function (...args) {
            const r = orig.apply(this, args);
            queueMicrotask(() => nav(fn === "pushState" ? "PUSH" : "REPLACE"));
            return r;
        };
    }
    window.addEventListener("popstate", () => nav("POP"));
}
