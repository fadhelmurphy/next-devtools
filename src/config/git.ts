import { execFile } from "node:child_process";
import https from "node:https";
import path from "node:path";
import type { GitCommit, GitInfo, GitRemote } from "../shared/types";
import { componentRange } from "./component-range";

const SEP = "\x1f";
const CACHE_TTL = 15_000;
const cache = new Map<string, { at: number; value: Promise<GitInfo> }>();
const loginCache = new Map<string, Promise<{ login?: string; avatar?: string } | null>>();
const RETRY_FAILED_LOOKUP = 10 * 60_000;

function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, timeout: 5000, maxBuffer: 1024 * 1024, windowsHide: true }, (err, stdout) => {
      if (err) reject(err);
      else resolve(String(stdout));
    });
  });
}

/** `git@github.com:owner/repo.git`, `https://gitlab.com/group/sub/repo`, `ssh://git@host:22/x/y.git` → web info. */
export function parseRemote(url: string): GitRemote | undefined {
  const u = url.trim();
  if (!u) return undefined;
  let host: string | undefined;
  let repoPath: string | undefined;
  let m: RegExpMatchArray | null;
  if ((m = u.match(/^[\w.-]+@([^:/]+):(.+)$/))) {
    // scp-like ssh: git@github.com:owner/repo.git
    host = m[1];
    repoPath = m[2];
  } else {
    try {
      const parsed = new URL(u);
      host = parsed.hostname;
      repoPath = parsed.pathname;
    } catch {
      return undefined;
    }
  }
  repoPath = repoPath.replace(/^\/+/, "").replace(/\.git$/, "").replace(/\/+$/, "");
  if (!host || !repoPath.includes("/")) return undefined;
  host = host.replace(/^ssh\./, "").replace(/^www\./, "");
  const provider: GitRemote["provider"] = /github/.test(host) ? "github" : /gitlab/.test(host) ? "gitlab" : /bitbucket/.test(host) ? "bitbucket" : "other";
  return { provider, host, path: repoPath, web: `https://${host}/${repoPath}` };
}

/** GitHub's private commit emails carry the username: `123+octocat@users.noreply.github.com`. */
export function githubLoginFromEmail(email: string): string | undefined {
  return email.match(/^(?:\d+\+)?([A-Za-z0-9-]+)@users\.noreply\.github\.com$/i)?.[1];
}

export function commitUrl(remote: GitRemote | undefined, sha: string): string | undefined {
  if (!remote || /^0+$/.test(sha)) return undefined;
  if (remote.provider === "gitlab") return `${remote.web}/-/commit/${sha}`;
  if (remote.provider === "bitbucket") return `${remote.web}/commits/${sha}`;
  return `${remote.web}/commit/${sha}`;
}

/** Best link for "who is this": their profile when known, else their commits in this repo. */
export function authorUrl(remote: GitRemote | undefined, commit: Pick<GitCommit, "authorName" | "authorEmail" | "login">, branch?: string): string | undefined {
  const login = commit.login ?? (remote?.provider === "github" ? githubLoginFromEmail(commit.authorEmail) : undefined);
  if (login && remote?.provider === "github") return `https://${remote.host}/${login}`;
  if (!remote) return undefined;
  if (remote.provider === "github") return `${remote.web}/commits?author=${encodeURIComponent(commit.authorEmail)}`;
  if (remote.provider === "gitlab") return `${remote.web}/-/commits/${encodeURIComponent(branch || "HEAD")}?author=${encodeURIComponent(commit.authorName)}`;
  return undefined;
}

/** Parse `git blame --porcelain` for one line. */
export function parseBlame(out: string): { sha: string; authorName: string; authorEmail: string; date: string; subject: string } | undefined {
  const lines = out.split("\n");
  const sha = lines[0]?.split(" ")[0];
  if (!sha || !/^[0-9a-f]{7,40}$/.test(sha)) return undefined;
  const get = (k: string) => lines.find((l) => l.startsWith(k + " "))?.slice(k.length + 1) ?? "";
  const time = Number(get("author-time"));
  return {
    sha,
    authorName: get("author"),
    authorEmail: get("author-mail").replace(/^<|>$/g, ""),
    date: time ? new Date(time * 1000).toISOString() : "",
    subject: get("summary"),
  };
}

export interface BlameEntry {
  sha: string;
  authorName: string;
  authorEmail: string;
  /** seconds since epoch */
  time: number;
  subject: string;
  lines: number;
}

/** Parse `git blame --porcelain` over a range: one entry per commit with how many lines it owns. */
export function parseBlameRange(out: string): BlameEntry[] {
  const bySha = new Map<string, BlameEntry>();
  let current: BlameEntry | undefined;
  for (const line of out.split("\n")) {
    const head = line.match(/^([0-9a-f]{40}) \d+ \d+/);
    if (head) {
      current = bySha.get(head[1]);
      if (!current) {
        current = { sha: head[1], authorName: "", authorEmail: "", time: 0, subject: "", lines: 0 };
        bySha.set(head[1], current);
      }
      current.lines++;
      continue;
    }
    if (!current || line.startsWith("\t")) continue;
    const sp = line.indexOf(" ");
    const key = sp === -1 ? line : line.slice(0, sp);
    const val = sp === -1 ? "" : line.slice(sp + 1);
    if (key === "author") current.authorName = val;
    else if (key === "author-mail") current.authorEmail = val.replace(/^<|>$/g, "");
    else if (key === "author-time") current.time = Number(val) || 0;
    else if (key === "summary") current.subject = val;
  }
  return [...bySha.values()];
}

/** Ask GitHub which account made a commit (public repos without a token; GITHUB_TOKEN for private ones). */
function githubAuthor(remote: GitRemote, sha: string): Promise<{ login?: string; avatar?: string } | null> {
  if (remote.provider !== "github" || remote.host !== "github.com") return Promise.resolve(null);
  const key = `${remote.path}@${sha}`;
  let hit = loginCache.get(key);
  if (!hit) {
    const headers: Record<string, string> = { "user-agent": "next-devtools", accept: "application/vnd.github+json" };
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) headers.authorization = `Bearer ${token}`;
    const url = `https://api.github.com/repos/${remote.path}/commits/${sha}`;
    const pick = (j: any) => (j?.author?.login ? { login: j.author.login as string, avatar: j.author.avatar_url as string } : null);
    // Offline, rate limited, private repo or commit not pushed yet: callers fall back to email-based links.
    hit =
      typeof fetch === "function" && typeof AbortController === "function"
        ? (() => {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 4000);
            return fetch(url, { headers, signal: ctrl.signal })
              .then((r) => (r.ok ? r.json() : null))
              .then(pick, () => null)
              .finally(() => clearTimeout(t));
          })()
        : new Promise((resolve) => {
            const req = https.get(url, { headers, timeout: 4000 }, (res) => {
              let body = "";
              res.setEncoding("utf8");
              res.on("data", (c) => (body += c));
              res.on("end", () => {
                try {
                  resolve(res.statusCode === 200 ? pick(JSON.parse(body)) : null);
                } catch {
                  resolve(null);
                }
              });
            });
            req.on("timeout", () => req.destroy());
            req.on("error", () => resolve(null));
          });
    loginCache.set(key, hit);
    // A miss is usually temporary (offline, rate limit, not pushed yet): forget it after a while.
    hit.then((r) => {
      if (!r) setTimeout(() => loginCache.delete(key), RETRY_FAILED_LOOKUP).unref?.();
    });
  }
  return hit;
}

async function enrich(c: Omit<GitCommit, "url" | "authorUrl" | "shortSha">, remote: GitRemote | undefined, branch: string | undefined, lookup: boolean): Promise<GitCommit> {
  const uncommitted = /^0+$/.test(c.sha);
  let login = remote?.provider === "github" ? githubLoginFromEmail(c.authorEmail) : undefined;
  let avatar: string | undefined;
  if (!uncommitted && remote && lookup) {
    const gh = await githubAuthor(remote, c.sha);
    if (gh?.login) {
      login = gh.login;
      avatar = gh.avatar;
    }
  }
  if (login && !avatar && remote?.host === "github.com") avatar = `https://github.com/${login}.png?size=64`;
  const commit: GitCommit = { ...c, shortSha: c.sha.slice(0, 7), login, avatar, uncommitted };
  commit.url = commitUrl(remote, c.sha);
  commit.authorUrl = uncommitted ? undefined : authorUrl(remote, commit, branch);
  return commit;
}

async function load(root: string, abs: string, line: number | undefined, name: string | undefined, lookup: boolean): Promise<GitInfo> {
  const dir = path.dirname(abs);
  let top: string;
  try {
    top = (await git(dir, ["rev-parse", "--show-toplevel"])).trim();
  } catch (e) {
    const missing = (e as NodeJS.ErrnoException).code === "ENOENT";
    return { available: false, reason: missing ? "git isn't installed or not on PATH" : "Not inside a git repository" };
  }

  const range = componentRange(abs, line, name);
  const [remoteUrl, branch, status, log, blame, rangeBlame] = await Promise.all([
    git(top, ["remote", "get-url", "origin"]).catch(() => ""),
    git(top, ["rev-parse", "--abbrev-ref", "HEAD"]).then((s) => s.trim()).catch(() => undefined),
    git(top, ["status", "--porcelain", "--", abs]).catch(() => ""),
    git(top, ["log", "-1", `--format=%H${SEP}%an${SEP}%ae${SEP}%aI${SEP}%s`, "--", abs]).catch(() => ""),
    line ? git(top, ["blame", "-L", `${line},${line}`, "--porcelain", "--", abs]).catch(() => "") : Promise.resolve(""),
    range ? git(top, ["blame", "-L", `${range.start},${range.end}`, "--porcelain", "--", abs]).catch(() => "") : Promise.resolve(""),
  ]);
  const remote = parseRemote(remoteUrl);
  const st = status.trim().slice(0, 2);
  const state: GitInfo["state"] = !st ? "clean" : st === "??" ? "untracked" : "modified";

  let file: GitCommit | undefined;
  const parts = log.trim().split(SEP);
  if (parts.length === 5 && parts[0]) {
    file = await enrich({ sha: parts[0], authorName: parts[1], authorEmail: parts[2], date: parts[3], subject: parts[4] }, remote, branch, lookup);
  }
  let lineCommit: GitCommit | undefined;
  const b = blame ? parseBlame(blame) : undefined;
  if (b) lineCommit = await enrich(b, remote, branch, lookup);

  let component: GitInfo["component"];
  if (range) {
    const entries = parseBlameRange(rangeBlame);
    const committed = entries.filter((e) => !/^0+$/.test(e.sha));
    const newest = committed.sort((a, b) => b.time - a.time)[0];
    const authors = new Map<string, { name: string; email: string; lines: number }>();
    for (const e of committed) {
      const a = authors.get(e.authorEmail) ?? { name: e.authorName, email: e.authorEmail, lines: 0 };
      a.lines += e.lines;
      authors.set(e.authorEmail, a);
    }
    component = {
      name: range.name,
      start: range.start,
      end: range.end,
      uncommittedLines: entries.filter((e) => /^0+$/.test(e.sha)).reduce((n, e) => n + e.lines, 0),
      authors: [...authors.values()].sort((a, b) => b.lines - a.lines),
      commit: newest
        ? await enrich(
            { sha: newest.sha, authorName: newest.authorName, authorEmail: newest.authorEmail, date: new Date(newest.time * 1000).toISOString(), subject: newest.subject },
            remote,
            branch,
            lookup,
          )
        : undefined,
    };
  }

  return {
    available: true,
    branch,
    remote,
    state,
    file,
    line: lineCommit,
    lineNumber: line,
    component,
    path: path.relative(top, abs).split(path.sep).join("/"),
  };
}

/**
 * Last commit touching a file, the commit that last changed one line, and — for the
 * component declared around that line (or named `name`) — the newest commit among
 * all of its lines. Cached briefly.
 */
export function getGitInfo(root: string, abs: string, line?: number, lookup = true, name?: string): Promise<GitInfo> {
  const key = `${abs}:${line ?? ""}:${name ?? ""}:${lookup ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;
  const value = load(root, abs, line, name, lookup).catch((e) => ({ available: false, reason: String(e?.message || e) }) as GitInfo);
  cache.set(key, { at: Date.now(), value });
  return value;
}
