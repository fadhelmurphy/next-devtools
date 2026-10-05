// Records docs/demo.gif from examples/app-router.
//   cd examples/app-router && npm install && npx next dev -p 3100
//   npm i -D playwright && npx playwright install chromium
//   node docs/record-demo.mjs   (then the ffmpeg command printed at the end)
import { chromium } from "playwright";

const W = 1200, H = 760;
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: "docs/.video", size: { width: W, height: H } },
});
// Headless video has no cursor — draw one.
await context.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l15 9-7 1.5L8.5 20z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    Object.assign(c.style, { position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none", transform: "translate(-3px,-2px)" });
    c.id = "demo-cursor";
    document.documentElement.appendChild(c);
    addEventListener("pointermove", (e) => { c.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 2}px)`; }, true);
  });
});
const page = await context.newPage();
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
const host = page.locator("#next-devtools-host");
const wait = (ms) => page.waitForTimeout(ms);
let pos = { x: W / 2, y: H / 2 };
const moveTo = async (x, y, steps = 18) => { await page.mouse.move(x, y, { steps }); pos = { x, y }; };
const center = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
const go = async (loc, steps) => { const c = await center(loc); await moveTo(c.x, c.y, steps); return c; };

await moveTo(700, 420, 1);
await wait(900);

// 1. Inspector: hover around, then click to open in editor
await go(host.locator(".nd-dock button[aria-label='Inspect an element']"), 22);
await wait(300);
await page.mouse.click(pos.x, pos.y);
await wait(400);
await go(page.locator("main h1"), 24); await wait(900);
await go(page.locator(".card p").first(), 16); await wait(800);
await go(page.locator("article.card h2").first(), 16); await wait(900);
await go(page.locator("article.card p").nth(1), 14); await wait(700);
const h2 = await go(page.locator("article.card h2").nth(1), 14); await wait(700);
await page.mouse.click(h2.x, h2.y);
await wait(1600);

// 2. Open the panel → Components
await go(host.locator(".nd-mark-btn"), 22);
await wait(250);
await page.mouse.click(pos.x, pos.y);
await wait(900);
await go(host.locator(".nd-tab", { hasText: "Components" }), 20);
await page.mouse.click(pos.x, pos.y);
await wait(900);
for (const name of ["Home", "ProductCard"]) {
  await go(host.locator(".nd-tree-row", { hasText: name }).first(), 12);
  await wait(500);
}
await go(host.locator(".nd-tree-row", { hasText: "Counter" }).first(), 10);
await page.mouse.click(pos.x, pos.y);
await wait(1000);
// interact with the app, watch state update live
await go(page.getByRole("button", { name: "Increment" }), 22);
for (let i = 0; i < 3; i++) { await page.mouse.click(pos.x, pos.y); await wait(550); }
await wait(900);

// 3. Routes → visit dynamic route with a param
await go(host.locator(".nd-tab", { hasText: "Routes" }), 22);
await page.mouse.click(pos.x, pos.y);
await wait(1000);
await go(host.locator("button[aria-label='Visit /blog/[slug]']"), 22);
await page.mouse.click(pos.x, pos.y);
await wait(400);
await page.keyboard.type("hello-next", { delay: 70 });
await wait(300);
await go(host.locator("form button", { hasText: "Visit" }), 14);
await page.mouse.click(pos.x, pos.y);
await wait(1700);

// 4. Overview for the new URL, then Performance
await go(host.locator(".nd-tab", { hasText: "Overview" }), 22);
await page.mouse.click(pos.x, pos.y);
await wait(1800);
await go(host.locator(".nd-tab", { hasText: "Performance" }), 16);
await page.mouse.click(pos.x, pos.y);
await wait(2600);
console.log("CLS shown:", await host.locator(".nd-vital", { hasText: "CLS" }).innerText().catch(() => "n/a"));
await wait(600);

await context.close();
await browser.close();
const video = await page.video().path();
console.log(`ffmpeg -y -ss 0.6 -i ${video} -vf "fps=10,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" docs/demo.gif`);
