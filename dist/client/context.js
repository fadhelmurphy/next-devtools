import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { openInEditor } from "./api.js";
import { getSettings, subscribeSettings } from "./settings.js";
export const Ctx = createContext(null);
export const useDevtools = () => useContext(Ctx);
export function useSettings() {
    const [s, set] = useState(getSettings);
    useEffect(() => subscribeSettings(set), []);
    return s;
}
export function useAsync(fn, deps = []) {
    const [state, setState] = useState({ loading: true });
    const run = useCallback((fresh = false) => {
        setState((s) => (Object.assign(Object.assign({}, s), { loading: true })));
        fn(fresh).then((data) => setState({ data, loading: false }), (error) => setState({ error, loading: false }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    useEffect(() => run(false), [run]);
    return Object.assign(Object.assign({}, state), { reload: () => run(true) });
}
export function ApiErrorBox({ error }) {
    const title = error.reason === "not-configured"
        ? "DevTools isn't set up in next.config"
        : error.reason === "unauthorized"
            ? "Port belongs to another project"
            : "Can't load project data";
    return (_jsxs("div", { className: "nd-error", role: "alert", children: [_jsx("strong", { children: title }), error.message, error.reason === "not-configured" && (_jsx("pre", { className: "nd-mono", style: { margin: "10px 0 0", whiteSpace: "pre-wrap" }, children: `// next.config.ts\nimport { withNextDevtools } from "@fadhelmurphy/next-devtools";\nexport default withNextDevtools(nextConfig);` }))] }));
}
export function FileLink({ loc, children }) {
    const { open } = useDevtools();
    if (!loc)
        return null;
    return (_jsx("button", { className: "nd-file", onClick: () => open(loc), title: "Open in editor", children: children !== null && children !== void 0 ? children : `${loc.file}${loc.line > 1 ? `:${loc.line}` : ""}` }));
}
export const openLocation = openInEditor;
