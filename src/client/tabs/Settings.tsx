import { useSettings } from "../context.js";
import { updateSettings, type EditorChoice } from "../settings.js";

const EDITORS: { value: EditorChoice; label: string }[] = [
  { value: "server", label: "Auto-detect (launch from next dev)" },
  { value: "vscode", label: "VS Code (vscode://)" },
  { value: "cursor", label: "Cursor (cursor://)" },
  { value: "windsurf", label: "Windsurf (windsurf://)" },
  { value: "zed", label: "Zed (zed://)" },
  { value: "webstorm", label: "WebStorm (webstorm://)" },
];

export function SettingsTab() {
  const s = useSettings();
  return (
    <div className="nd-form">
      <label className="nd-field">
        <span>Open files in</span>
        <span>
          <select className="nd-select" value={s.editor} onChange={(e) => updateSettings({ editor: e.target.value as EditorChoice })}>
            {EDITORS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <p>Auto-detect uses the editor that's running, or the <code>LAUNCH_EDITOR</code> environment variable.</p>
        </span>
      </label>

      <label className="nd-field">
        <span>Theme</span>
        <span>
          <select className="nd-select" value={s.theme} onChange={(e) => updateSettings({ theme: e.target.value as any })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">Match system</option>
          </select>
        </span>
      </label>

      <div className="nd-field">
        <span>Floating button</span>
        <span>
          <label className="nd-check">
            <input type="checkbox" checked={s.showButton} onChange={(e) => updateSettings({ showButton: e.target.checked })} />
            Show the button at the bottom of the page
          </label>
          <p>When hidden, open DevTools with the keyboard shortcut.</p>
        </span>
      </div>

      <div className="nd-field">
        <span>Component tree</span>
        <span>
          <label className="nd-check">
            <input type="checkbox" checked={!s.hideInternals} onChange={(e) => updateSettings({ hideInternals: !e.target.checked })} />
            Show Next.js internals (LayoutRouter, boundaries…)
          </label>
        </span>
      </div>

      <div className="nd-field">
        <span>Panel height</span>
        <span>
          <button className="nd-btn" onClick={() => updateSettings({ height: 0 })}>
            Reset to default
          </button>
          <p>Drag the top edge of the panel to resize it.</p>
        </span>
      </div>

      <div className="nd-field">
        <span>Keyboard</span>
        <div className="nd-keys">
          <span><kbd>Shift</kbd> <kbd>Alt</kbd> <kbd>D</kbd></span>
          <span className="nd-muted">Open or close DevTools</span>
          <span><kbd>Shift</kbd> <kbd>Alt</kbd> <kbd>C</kbd></span>
          <span className="nd-muted">Inspect an element and open its source</span>
          <span><kbd>Shift</kbd> + click</span>
          <span className="nd-muted">Open source and keep inspecting</span>
          <span><kbd>Esc</kbd></span>
          <span className="nd-muted">Stop inspecting, then close the panel</span>
        </div>
      </div>
    </div>
  );
}
