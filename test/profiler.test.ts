import { describe, expect, it } from "vitest";
import { describeReason, formatMs, reasonFor, severity } from "../src/client/profiler";

const hook = (state: unknown, next: any = null, stateful = true) => ({ memoizedState: state, queue: stateful ? { dispatch() {} } : null, next });

describe("render reasons", () => {
  it("detects mount, state, props and parent re-renders", () => {
    expect(reasonFor({ tag: 0, alternate: null })).toEqual({ kind: "mount" });

    const prevHooks = hook(1, hook("a"));
    const nextHooks = hook(1, hook("b"));
    expect(reasonFor({ tag: 0, memoizedState: nextHooks, memoizedProps: { x: 1 }, alternate: { memoizedState: prevHooks, memoizedProps: { x: 1 } } })).toEqual({ kind: "state", hooks: [2] });

    // non-stateful hooks (useMemo, useRef…) don't count as state
    const memoPrev = hook([1], null, false), memoNext = hook([2], null, false);
    expect(reasonFor({ tag: 0, memoizedState: memoNext, memoizedProps: { a: 1, b: 2 }, alternate: { memoizedState: memoPrev, memoizedProps: { a: 1, b: 3 } } })).toEqual({ kind: "props", keys: ["b"] });

    const props = { a: 1 };
    expect(reasonFor({ tag: 0, memoizedState: null, memoizedProps: { ...props }, alternate: { memoizedState: null, memoizedProps: props } })).toEqual({ kind: "parent" });

    expect(reasonFor({ tag: 1, memoizedState: { n: 2 }, memoizedProps: {}, alternate: { memoizedState: { n: 1 }, memoizedProps: {} } })).toEqual({ kind: "state", hooks: [] });
  });

  it("describes reasons and formats times", () => {
    expect(describeReason({ kind: "props", keys: ["a", "b", "c", "d", "e", "f"] })).toBe("Props changed: a, b, c, d +2");
    expect(describeReason({ kind: "state", hooks: [1] })).toBe("State changed (hook 1)");
    expect(formatMs(0)).toBe("<0.1 ms");
    expect(formatMs(0.42)).toBe("0.42 ms");
    expect(formatMs(12.34)).toBe("12.3 ms");
    expect(formatMs(250.4)).toBe("250 ms");
    expect([severity(1), severity(8), severity(30)]).toEqual(["good", "warn", "bad"]);
  });
});
