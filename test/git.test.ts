import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { authorUrl, commitUrl, getGitInfo, githubLoginFromEmail, parseBlame, parseRemote } from "../src/config/git";
import { timeAgo } from "../src/client/GitCard";

describe("remote parsing", () => {
  it("understands ssh, https and nested GitLab groups", () => {
    expect(parseRemote("git@github.com:fadhelmurphy/next-devtools.git")).toEqual({
      provider: "github",
      host: "github.com",
      path: "fadhelmurphy/next-devtools",
      web: "https://github.com/fadhelmurphy/next-devtools",
    });
    expect(parseRemote("https://github.com/a/b")?.web).toBe("https://github.com/a/b");
    expect(parseRemote("ssh://git@gitlab.com:22/group/sub/repo.git")).toMatchObject({ provider: "gitlab", path: "group/sub/repo" });
    expect(parseRemote("https://bitbucket.org/team/app.git")?.provider).toBe("bitbucket");
    expect(parseRemote("/srv/git/local.git")).toBeUndefined();
    expect(parseRemote("")).toBeUndefined();
  });
});

describe("author links", () => {
  const gh = parseRemote("git@github.com:acme/shop.git");
  const gl = parseRemote("https://gitlab.com/acme/shop.git");

  it("reads the username out of GitHub noreply emails", () => {
    expect(githubLoginFromEmail("12345+octocat@users.noreply.github.com")).toBe("octocat");
    expect(githubLoginFromEmail("octocat@users.noreply.github.com")).toBe("octocat");
    expect(githubLoginFromEmail("me@example.com")).toBeUndefined();
  });

  it("links to the profile when the account is known, else to the author's commits", () => {
    expect(authorUrl(gh, { authorName: "Octo", authorEmail: "1+octocat@users.noreply.github.com" })).toBe("https://github.com/octocat");
    expect(authorUrl(gh, { authorName: "Octo", authorEmail: "x@y.z", login: "octo" })).toBe("https://github.com/octo");
    expect(authorUrl(gh, { authorName: "Octo", authorEmail: "me@example.com" })).toBe("https://github.com/acme/shop/commits?author=me%40example.com");
    expect(authorUrl(gl, { authorName: "Jo Doe", authorEmail: "jo@x.io" }, "main")).toBe("https://gitlab.com/acme/shop/-/commits/main?author=Jo%20Doe");
    expect(authorUrl(undefined, { authorName: "A", authorEmail: "a@b.c" })).toBeUndefined();
  });

  it("builds commit links per provider and none for uncommitted lines", () => {
    expect(commitUrl(gh, "abc1234")).toBe("https://github.com/acme/shop/commit/abc1234");
    expect(commitUrl(gl, "abc1234")).toBe("https://gitlab.com/acme/shop/-/commit/abc1234");
    expect(commitUrl(gh, "0000000000000000000000000000000000000000")).toBeUndefined();
  });
});

describe("blame parsing", () => {
  it("reads porcelain output", () => {
    const out = [
      "4f2a9e0c1d2b3a4f5e6d7c8b9a0f1e2d3c4b5a69 12 12 1",
      "author Fadhel Ijlal Falah",
      "author-mail <fadhel@example.com>",
      "author-time 1791600000",
      "author-tz +0700",
      "summary Add product card",
      "filename components/ProductCard.tsx",
      "\t<article className=\"card\">",
    ].join("\n");
    expect(parseBlame(out)).toEqual({
      sha: "4f2a9e0c1d2b3a4f5e6d7c8b9a0f1e2d3c4b5a69",
      authorName: "Fadhel Ijlal Falah",
      authorEmail: "fadhel@example.com",
      date: new Date(1791600000 * 1000).toISOString(),
      subject: "Add product card",
    });
  });
});

describe("getGitInfo on a real repository", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nd-git-"));
  const run = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      env: { ...process.env, GIT_AUTHOR_DATE: "2026-01-02T03:04:05Z", GIT_COMMITTER_DATE: "2026-01-02T03:04:05Z" },
    });
  run("init", "-q", "-b", "main");
  run("config", "user.name", "Ada Lovelace");
  run("config", "user.email", "42+ada@users.noreply.github.com");
  run("config", "commit.gpgsign", "false");
  run("remote", "add", "origin", "git@github.com:acme/shop.git");
  fs.mkdirSync(path.join(root, "components"));
  const file = path.join(root, "components", "Card.tsx");
  fs.writeFileSync(file, "export function Card() {\n  return <div />;\n}\n");
  run("add", ".");
  run("commit", "-q", "-m", "Add card");

  it("returns the file's last commit, the line's commit and profile links", async () => {
    const info = await getGitInfo(root, file, 2, false);
    expect(info).toMatchObject({ available: true, branch: "main", state: "clean", path: "components/Card.tsx", lineNumber: 2 });
    expect(info.file).toMatchObject({ authorName: "Ada Lovelace", subject: "Add card", login: "ada", authorUrl: "https://github.com/ada" });
    expect(info.file?.date.startsWith("2026-01-02")).toBe(true);
    expect(info.file?.url).toBe(`https://github.com/acme/shop/commit/${info.file?.sha}`);
    expect(info.line?.sha).toBe(info.file?.sha);
  });

  it("flags uncommitted edits and blames new lines as not committed", async () => {
    fs.writeFileSync(file, "export function Card() {\n  return <section />;\n}\n");
    const info = await getGitInfo(root, file, 2, false).then(() => getGitInfo(root, file, 3, false));
    expect(info.state).toBe("modified");
    const fresh = await getGitInfo(root, file, 2, true); // different cache key
    expect(fresh.line?.uncommitted).toBe(true);
    expect(fresh.line?.authorUrl).toBeUndefined();
  });

  it("reports when the file isn't in a repository", async () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "nd-nogit-"));
    const f = path.join(outside, "a.tsx");
    fs.writeFileSync(f, "x");
    const info = await getGitInfo(outside, f, 1, false);
    expect(info.available).toBe(false);
  });
});

describe("timeAgo", () => {
  it("formats relative dates", () => {
    const now = Date.parse("2026-10-11T12:00:00Z");
    expect(timeAgo("2026-10-08T12:00:00Z", now)).toMatch(/3 days ago/);
    expect(timeAgo("2026-10-11T11:30:00Z", now)).toMatch(/30 minutes ago/);
    expect(timeAgo("not a date", now)).toBe("");
  });
});
