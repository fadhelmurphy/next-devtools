import * as ReactDOM from "react-dom";
/** React 17 (Next.js 10–12): legacy root. Selected by withNextDevtools when React < 18. */
export function renderRoot(element, container) {
    const dom = ReactDOM;
    dom.render(element, container);
    return () => dom.unmountComponentAtNode(container);
}
