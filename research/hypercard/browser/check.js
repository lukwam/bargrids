// Drive the bargrids page in headless Chromium and check the fixes that only show up in a browser.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const page_url = "file://" + path.join(process.env.HOME, "src/bargrids/docs/index.html");
const dw = fs.readFileSync(path.join(__dirname, "../dw_bargrids2.eps"), "latin1");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const alerts = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", async (d) => { alerts.push(d.message()); await d.dismiss(); });
  await page.goto(page_url);

  // 1. 90 degree symmetry on a non-square grid
  const sym = await page.evaluate(() => {
    document.getElementById("symmetry-rotate-90").checked = true;
    setWidth("9");
    return {
      rotate90Disabled: document.getElementById("symmetry-rotate-90").disabled,
      selected: getSymmetry(),
    };
  });
  console.log("9x8 grid:", sym);
  await page.evaluate(() => setWidth("8"));
  console.log("8x8 grid, rotate-90 disabled:", await page.evaluate(() => document.getElementById("symmetry-rotate-90").disabled));

  // 2. size limits
  const size = await page.evaluate(() => {
    setWidth("30"); const a = [document.getElementById("width").value, puzzle.cols];
    setDepth("1"); const b = [document.getElementById("depth").value, puzzle.rows];
    setWidth("7.5"); const c = [document.getElementById("width").value, puzzle.cols];
    return { width30: a, depth1: b, width7_5: c };
  });
  console.log("rejected sizes (input, puzzle):", size, "alerts:", alerts.length);

  // 3. 25x25 preset
  await page.selectOption("select[name=grid_size]", { label: "25 by 25" });
  console.log("25x25 preset:", await page.evaluate(() => [puzzle.rows, puzzle.cols, document.querySelectorAll("#grid-bars-layer > *").length]));

  // 4. EPS import, then save an SVG with the answers layer hidden
  const saved = await page.evaluate((eps) => {
    parseEPS(eps);
    const box = document.getElementById("view-answers");
    box.checked = false;
    box.onchange();
    const link = document.getElementById("svg-download");
    link.click = () => {};
    saveSVG();
    const svg = decodeURIComponent(link.href.split(",").slice(1).join(","));
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const count = (id) => doc.getElementById(id) ? doc.getElementById(id).children.length : "missing";
    const result = {
      title: puzzle.title,
      answersInFile: count("svg-answers"),
      numbersInFile: count("svg-numbers"),
      shadesInFile: count("svg-shadesquares"),
      hiddenClassInFile: svg.includes('class="hidden"'),
      answersStillOnScreen: puzzle.answers.flat().filter(Boolean).length,
    };
    parseSVG(svg);
    result.reloaded = { numbers: puzzle.numbers.flat().filter(Boolean).length, answers: puzzle.answers.flat().filter(Boolean).length };
    return result;
  }, dw);
  console.log("number-grid SVG:", saved);

  console.log("page errors:", errors);
  await browser.close();
})();
