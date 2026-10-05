import { createRoot, type Root } from "react-dom/client";
import { App } from "./App.js";
import { HOST_ID } from "./fiber.js";
import { attachOverlay } from "./overlay.js";
import { styles } from "./styles.js";
import { startVitals } from "./vitals.js";
import { installNetworkRecorder } from "./network.js";

let root: Root | null = null;
let host: HTMLElement | null = null;

/**
 * Renders the panel in its own React root inside a shadow DOM, so it neither
 * inherits the app's CSS nor shows up in (or re-renders with) the app's tree.
 */
export function mount(): () => void {
  startVitals();
  installNetworkRecorder();
  if (!host || !host.isConnected) {
    host = document.getElementById(HOST_ID) ?? document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("data-next-devtools", "");
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadow.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = styles;
    const overlayContainer = document.createElement("div");
    overlayContainer.className = "nd-root";
    const app = document.createElement("div");
    shadow.append(style, overlayContainer, app);
    attachOverlay(overlayContainer);
    document.body.appendChild(host);
    root = createRoot(app);
    root.render(<App />);
  }
  return () => {
    root?.unmount();
    root = null;
    host?.remove();
    host = null;
  };
}
