import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, openInEditor, type SourceLocation } from "./api.js";
import { getSettings, subscribeSettings, type Settings } from "./settings.js";

export interface DevtoolsContext {
  toast: (msg: string) => void;
  open: (loc: SourceLocation | null | undefined) => void;
  /** Ask the Components tab to select the component that rendered `el`. */
  reveal: (el: Element) => void;
  pendingReveal: Element | null;
  clearReveal: () => void;
  setTab: (tab: string) => void;
  startPick: () => void;
  picking: boolean;
}

export const Ctx = createContext<DevtoolsContext>(null as any);
export const useDevtools = () => useContext(Ctx);

export function useSettings(): Settings {
  const [s, set] = useState(getSettings);
  useEffect(() => subscribeSettings(set), []);
  return s;
}

export function useAsync<T>(fn: (fresh: boolean) => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data?: T; error?: ApiError | Error; loading: boolean }>({ loading: true });
  const run = useCallback((fresh = false) => {
    setState((s) => ({ ...s, loading: true }));
    fn(fresh).then(
      (data) => setState({ data, loading: false }),
      (error) => setState({ error, loading: false }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => run(false), [run]);
  return { ...state, reload: () => run(true) };
}

export function ApiErrorBox({ error }: { error: Error }) {
  const title =
    (error as ApiError).reason === "not-configured"
      ? "DevTools isn't set up in next.config"
      : (error as ApiError).reason === "unauthorized"
        ? "Port belongs to another project"
        : "Can't load project data";
  return (
    <div className="nd-error" role="alert">
      <strong>{title}</strong>
      {error.message}
      {(error as ApiError).reason === "not-configured" && (
        <pre className="nd-mono" style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>
          {`// next.config.ts\nimport { withNextDevtools } from "@fadhelmurphy/next-devtools";\nexport default withNextDevtools(nextConfig);`}
        </pre>
      )}
    </div>
  );
}

export function FileLink({ loc, children }: { loc: SourceLocation | null | undefined; children?: ReactNode }) {
  const { open } = useDevtools();
  if (!loc) return null;
  return (
    <button className="nd-file" onClick={() => open(loc)} title="Open in editor">
      {children ?? `${loc.file}${loc.line > 1 ? `:${loc.line}` : ""}`}
    </button>
  );
}

export const openLocation = openInEditor;
