import { jsx as _jsx } from "react/jsx-runtime";
import { App } from "./App.js";
import { renderRoot } from "./root.js";
import { HOST_ID } from "./fiber.js";
import { attachOverlay } from "./overlay.js";
import { styles } from "./styles.js";
import { startVitals } from "./vitals.js";
import { installNetworkRecorder } from "./network.js";
let unmountRoot = null;
let host = null;
/**
 * Renders the panel in its own React root inside a shadow DOM, so it neither
 * inherits the app's CSS nor shows up in (or re-renders with) the app's tree.
 */
export function mount() {
    var _a, _b;
    startVitals();
    installNetworkRecorder();
    if (!host || !host.isConnected) {
        host = (_a = document.getElementById(HOST_ID)) !== null && _a !== void 0 ? _a : document.createElement("div");
        host.id = HOST_ID;
        host.setAttribute("data-next-devtools", "");
        const shadow = (_b = host.shadowRoot) !== null && _b !== void 0 ? _b : host.attachShadow({ mode: "open" });
        shadow.innerHTML = "";
        const style = document.createElement("style");
        style.textContent = styles;
        const overlayContainer = document.createElement("div");
        overlayContainer.className = "nd-root";
        const app = document.createElement("div");
        shadow.append(style, overlayContainer, app);
        attachOverlay(overlayContainer);
        document.body.appendChild(host);
        unmountRoot = renderRoot(_jsx(App, {}), app);
    }
    return () => {
        unmountRoot === null || unmountRoot === void 0 ? void 0 : unmountRoot();
        unmountRoot = null;
        host === null || host === void 0 ? void 0 : host.remove();
        host = null;
    };
}
