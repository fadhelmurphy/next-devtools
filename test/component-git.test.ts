import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findComponentCandidates, pickComponentRange } from "../src/config/component-range";
import { getGitInfo, parseBlameRange } from "../src/config/git";

const SRC = `import { memo, useState } from "react";

export function Header({ title }) {
  return <h1>{title}</h1>;
}

export const Counter = memo(function Counter() {
  const [n, setN] = useState(0);
  return (
    <button onClick={() => setN(n + 1)}>
      {n}
    </button>
  );
});

const Footer = () => <footer>bye</footer>;

export default function Page() {
  return (
    <main>
      <Header title="x" />
      <Counter />
      <Footer />
    </main>
  );
}
`;

describe("component ranges", () => {
  const c = findComponentCandidates(SRC, "page.jsx");

  it("finds function, memo-wrapped, arrow and default-export components", () => {
    const names = c.map((x) => `${x.name ?? "default"}:${x.start}-${x.end}`);
    expect(names).toEqual(expect.arrayContaining(["Header:3-5", "Counter:7-14", "Footer:16-16", "Page:18-26"]));
  });

  it("picks the component around a JSX line, or by name", () => {
    expect(pickComponentRange(c, 10)).toMatchObject({ name: "Counter", start: 7, end: 14 });
    expect(pickComponentRange(c, 4)).toMatchObject({ name: "Header", start: 3, end: 5 });
    expect(pickComponentRange(c, undefined, "Footer")).toMatchObject({ start: 16, end: 16 });
    expect(pickComponentRange(c, 21, "Page")).toMatchObject({ start: 18, end: 26 });
    // name not found: fall back to position
    expect(pickComponentRange(c, 4, "Nope")).toMatchObject({ name: "Header" });
  });

  it("handles TypeScript and forwardRef", () => {
    const ts = `import { forwardRef } from "react";\ntype P = { a: string };\nexport const Input = forwardRef<HTMLInputElement, P>((props, ref) => {\n  return <input ref={ref} />;\n});\n`;
    expect(pickComponentRange(findComponentCandidates(ts, "x.tsx"), 4)).toMatchObject({ name: "Input", start: 3, end: 5 });
  });
});

describe("blame over a range", () => {
  it("counts lines per commit", () => {
    const a = "a".repeat(40), b = "b".repeat(40);
    const out = [
      `${a} 1 1 2`, "author Ann", "author-mail <ann@x.io>", "author-time 100", "summary first", "filename f", "\tline1",
      `${a} 2 2`, "\tline2",
      `${b} 3 3 1`, "author Bob", "author-mail <bob@x.io>", "author-time 200", "summary second", "filename f", "\tline3",
    ].join("\n");
    expect(parseBlameRange(out)).toEqual([
      { sha: a, authorName: "Ann", authorEmail: "ann@x.io", time: 100, subject: "first", lines: 2 },
      { sha: b, authorName: "Bob", authorEmail: "bob@x.io", time: 200, subject: "second", lines: 1 },
    ]);
  });
});

describe("per-component git info", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nd-cgit-"));
  const file = path.join(root, "page.jsx");
  let t = Date.parse("2026-03-01T00:00:00Z") / 1000;
  const commit = (author: string, email: string, msg: string) => {
    t += 3600;
    const env = { ...process.env, GIT_AUTHOR_NAME: author, GIT_AUTHOR_EMAIL: email, GIT_COMMITTER_NAME: author, GIT_COMMITTER_EMAIL: email, GIT_AUTHOR_DATE: `${t} +0000`, GIT_COMMITTER_DATE: `${t} +0000` };
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-q", "-m", msg], { cwd: root, env });
  };
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  fs.writeFileSync(file, SRC);
  commit("Ann", "ann@x.io", "Initial page");
  // Bob edits only Counter (line 8: the useState line, not the JSX line)
  fs.writeFileSync(file, SRC.replace("useState(0)", "useState(1)"));
  commit("Bob", "bob@x.io", "Start counter at 1");
  // Cy edits only Footer
  fs.writeFileSync(file, SRC.replace("useState(0)", "useState(1)").replace("bye", "see you"));
  commit("Cy", "cy@x.io", "Friendlier footer");

  it("attributes each component to the newest commit among its own lines", async () => {
    const counter = await getGitInfo(root, file, 10, false, "Counter");
    expect(counter.component).toMatchObject({ name: "Counter", start: 7, end: 14, uncommittedLines: 0 });
    expect(counter.component?.commit).toMatchObject({ authorName: "Bob", subject: "Start counter at 1" });
    // the single JSX line was never touched by Bob
    expect(counter.line?.authorName).toBe("Ann");
    // the file's last commit is Cy's
    expect(counter.file?.authorName).toBe("Cy");
    expect(counter.component?.authors.map((a) => a.name)).toEqual(["Ann", "Bob"]);

    const header = await getGitInfo(root, file, 4, false, "Header");
    expect(header.component?.commit?.authorName).toBe("Ann");

    const footer = await getGitInfo(root, file, undefined, false, "Footer");
    expect(footer.component?.commit?.subject).toBe("Friendlier footer");
  });

  it("counts uncommitted lines inside the component only", async () => {
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("<h1>{title}</h1>", "<h1 className=\"t\">{title}</h1>"));
    const header = await getGitInfo(root, file, 4, true, "Header");
    expect(header.state).toBe("modified");
    expect(header.component?.uncommittedLines).toBe(1);
    const counter = await getGitInfo(root, file, 10, true, "Counter");
    expect(counter.component?.uncommittedLines).toBe(0);
  });
});
