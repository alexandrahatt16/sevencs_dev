#!/usr/bin/env node
/**
 * Screenshot a local HTML file or URL with Puppeteer.
 *
 * Usage:
 *   node tools/screenshot.mjs <input> <output.png> [options]
 *
 * Arguments:
 *   <input>        Path to a local .html file, or an http(s):// URL.
 *   <output.png>   Path to write the PNG to (directories are created).
 *
 * Options:
 *   --width=N      Viewport width in px (default: 1280).
 *   --height=N     Viewport height in px (default: 900). Ignored when fullpage.
 *   --fullpage     Capture the entire scrollable page (default: on).
 *   --no-fullpage  Capture only the viewport.
 *   --selector=S   Capture only the element matching CSS selector S.
 *   --scale=N      Device scale factor / DPR (default: 2 for crisp captures).
 *   --wait=MS      Extra wait after load for fonts/animations (default: 400).
 *
 * Examples:
 *   node tools/screenshot.mjs index.html .tmp/full.png
 *   node tools/screenshot.mjs index.html .tmp/hero.png --selector="header.cc-header"
 *   node tools/screenshot.mjs index.html .tmp/mobile.png --width=390 --scale=2
 */

import { pathToFileURL } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import puppeteer from "puppeteer";

function parseArgs(argv) {
  const positional = [];
  const opts = { width: 1280, height: 900, fullpage: true, scale: 2, wait: 400, selector: null };
  for (const arg of argv) {
    if (arg === "--fullpage") opts.fullpage = true;
    else if (arg === "--no-fullpage") opts.fullpage = false;
    else if (arg.startsWith("--width=")) opts.width = Number(arg.slice(8));
    else if (arg.startsWith("--height=")) opts.height = Number(arg.slice(9));
    else if (arg.startsWith("--scale=")) opts.scale = Number(arg.slice(8));
    else if (arg.startsWith("--wait=")) opts.wait = Number(arg.slice(7));
    else if (arg.startsWith("--selector=")) opts.selector = arg.slice(11);
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }
  return { positional, opts };
}

function toTargetUrl(input) {
  if (/^https?:\/\//i.test(input)) return input;
  const abs = resolve(input);
  if (!existsSync(abs)) throw new Error(`Input file not found: ${abs}`);
  return pathToFileURL(abs).href;
}

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  const [input, output] = positional;

  if (!input || !output) {
    console.error("Usage: node tools/screenshot.mjs <input.html|url> <output.png> [options]");
    process.exit(1);
  }

  const url = toTargetUrl(input);
  const outAbs = resolve(output);
  mkdirSync(dirname(outAbs), { recursive: true });

  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: opts.width,
      height: opts.height,
      deviceScaleFactor: opts.scale,
    });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    if (opts.wait > 0) await new Promise((r) => setTimeout(r, opts.wait));

    if (opts.selector) {
      const el = await page.$(opts.selector);
      if (!el) throw new Error(`Selector not found: ${opts.selector}`);
      await el.screenshot({ path: outAbs });
    } else {
      await page.screenshot({ path: outAbs, fullPage: opts.fullpage });
    }

    console.log(`Saved ${outAbs}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
