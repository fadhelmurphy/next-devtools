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

/** Last commit that changed a component (any of its lines), plus the file's last commit. */
export function GitCard({ file, line, name }: { file: string; line?: number; name?: string }) {
  const [info, setInfo] = useState<GitInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setInfo(null);
    setError(null);
    api.git(file, line, true, name).then(
      (r) => alive && setInfo(r),
      (e) => alive && setError((e as Error).message),
    );
    return () => {
      alive = false;
    };
  }, [file, line, name]);

  if (error) return <span className="nd-faint">{error}</span>;
  if (!info) return <span className="nd-faint">Reading git history…</span>;
  if (!info.available) return <span className="nd-faint">{info.reason}</span>;
  const comp = info.component;
  const compName = comp?.name ?? name ?? "this component";
  const sameCommit = comp?.commit && info.file && comp.commit.sha === info.file.sha;

  return (
    <div className="nd-git">
      {(info.state === "untracked" || (comp?.uncommittedLines ?? 0) > 0) && (
        <div className="nd-git-state">
          <span className="nd-badge nd-badge-server">
            {info.state === "untracked"
              ? "Untracked file"
              : `${comp!.uncommittedLines} uncommitted ${comp!.uncommittedLines === 1 ? "line" : "lines"} in ${compName}`}
          </span>
        </div>
      )}
      {comp?.commit && (
        <Commit c={comp.commit} label={`Last change to ${compName} (lines ${comp.start}–${comp.end})`} />
      )}
      {comp && !comp.commit && info.state !== "untracked" && <span className="nd-faint">{compName} hasn't been committed yet.</span>}
      {comp && comp.authors.length > 1 && (
        <div className="nd-git-authors nd-faint">
          Written by{" "}
          {comp.authors.slice(0, 3).map((a, i) => (
            <span key={a.email}>
              {i > 0 ? ", " : ""}
              <span title={a.email}>{a.name}</span> ({a.lines} {a.lines === 1 ? "line" : "lines"})
            </span>
          ))}
          {comp.authors.length > 3 ? ` and ${comp.authors.length - 3} more` : ""}
        </div>
      )}
      {info.file && !sameCommit && <Commit c={info.file} label={comp ? "Last commit to the file" : "Last commit to this file"} />}
      {!info.file && info.state !== "untracked" && <span className="nd-faint">No commits for this file yet.</span>}
      {info.state === "modified" && !(comp?.uncommittedLines ?? 0) && (
        <span className="nd-faint">The file has uncommitted changes outside {compName}.</span>
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
