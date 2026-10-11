import { useEffect, useState } from "react";
import type { GitCommit, GitInfo } from "../shared/types.js";
import { api } from "./api.js";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!t) return "";
  const secs = Math.round((t - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  }
  return rtf.format(0, "minute");
}

const fullDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function Avatar({ c }: { c: GitCommit }) {
  const [failed, setFailed] = useState(false);
  if (c.avatar && !failed) return <img className="nd-avatar" src={c.avatar} alt="" onError={() => setFailed(true)} />;
  return (
    <span className="nd-avatar nd-avatar-initials" aria-hidden="true">
      {initials(c.authorName)}
    </span>
  );
}

function Commit({ c, label }: { c: GitCommit; label: string }) {
  if (c.uncommitted) {
    return (
      <div className="nd-commit">
        <div className="nd-commit-label">{label}</div>
        <div className="nd-commit-body">
          <span className="nd-badge nd-badge-server">Not committed yet</span>
        </div>
      </div>
    );
  }
  const who = c.login ? `${c.authorName} (@${c.login})` : c.authorName;
  return (
    <div className="nd-commit">
      <div className="nd-commit-label">{label}</div>
      <div className="nd-commit-body">
        <Avatar c={c} />
        <div className="nd-commit-text">
          <div className="nd-commit-who">
            {c.authorUrl ? (
              <a className="nd-link" href={c.authorUrl} target="_blank" rel="noreferrer" title={c.login ? "Open profile" : `Commits by ${c.authorEmail}`}>
                {who}
              </a>
            ) : (
              <span title={c.authorEmail}>{who}</span>
            )}
            <time className="nd-faint" dateTime={c.date} title={fullDate(c.date)}>
              {timeAgo(c.date)}
            </time>
          </div>
          <div className="nd-commit-msg">
            {c.url ? (
              <a className="nd-commit-sha" href={c.url} target="_blank" rel="noreferrer" title="Open commit">
                {c.shortSha}
              </a>
            ) : (
              <code className="nd-commit-sha">{c.shortSha}</code>
            )}
            <span>{c.subject}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Last commit for a component's file and line. */
export function GitCard({ file, line }: { file: string; line?: number }) {
  const [info, setInfo] = useState<GitInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setInfo(null);
    setError(null);
    api.git(file, line).then(
      (r) => alive && setInfo(r),
      (e) => alive && setError((e as Error).message),
    );
    return () => {
      alive = false;
    };
  }, [file, line]);

  if (error) return <span className="nd-faint">{error}</span>;
  if (!info) return <span className="nd-faint">Reading git history…</span>;
  if (!info.available) return <span className="nd-faint">{info.reason}</span>;
  const sameCommit = info.line && info.file && info.line.sha === info.file.sha;

  return (
    <div className="nd-git">
      {info.state !== "clean" && (
        <div className="nd-git-state">
          <span className="nd-badge nd-badge-server">{info.state === "untracked" ? "Untracked file" : "Uncommitted changes"}</span>
        </div>
      )}
      {info.line && !sameCommit && <Commit c={info.line} label={`Line ${info.lineNumber} last changed`} />}
      {info.file ? (
        <Commit c={info.file} label={sameCommit ? `Last commit (file and line ${info.lineNumber})` : "Last commit to this file"} />
      ) : (
        <span className="nd-faint">No commits for this file yet.</span>
      )}
      {info.remote && (info.remote.provider === "github" || info.remote.provider === "gitlab") && (
        <div className="nd-faint nd-git-foot">
          <a className="nd-link" href={`${info.remote.web}${info.remote.provider === "gitlab" ? "/-/commits" : "/commits"}/${info.branch ?? "HEAD"}/${info.path ?? ""}`} target="_blank" rel="noreferrer">
            File history
          </a>{" "}
          on {info.remote.path}
          {info.branch ? ` (${info.branch})` : ""}
        </div>
      )}
    </div>
  );
}
