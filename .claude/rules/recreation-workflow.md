# Website Recreation Workflow

When the user provides a reference image (screenshot) and optionally some CSS classes or style notes:

1. **Generate** a single `index.html` file using Tailwind CSS (via CDN). Include all content inline - no external files unless requested.
2. **Screenshot** the rendered page using the project's Puppeteer tool: `node tools/screenshot.mjs index.html .tmp/full.png`. If the page has distinct sections, capture those individually with `--selector="<css>"` (e.g. `node tools/screenshot.mjs index.html .tmp/hero.png --selector="header.cc-header"`). Use `--width=390` to check mobile. Run `npm install` once first if `node_modules/` is missing.
3. **Compare** your screenshot against the reference image. Check for mismatches in:
   - Spacing and padding (measure in px)
   - Font sizes, weights, and line heights
   - Colors (exact hex values)
   - Alignment and positioning
   - Border radii, shadows, and effects
   - Responsive behavior
   - Image/icon sizing and placement
4. **Fix** every mismatch found. Edit the HTML/Tailwind code.
5. **Re-screenshot** and compare again.
6. **Repeat** steps 3-5 until the result is within ~2-3px of the reference everywhere.

Do NOT stop after one pass. Always do at least 2 comparison rounds. Only stop when the user says so or when no visible differences remain.
