/*
 * Layout-aware PDF text extraction for resume imports.
 *
 * pdf-parse v1 exposes PDF.js page objects through its pagerender callback.
 * We use the text item's x/y coordinates to rebuild lines and detect
 * obvious two-column pages. Single-column pages fall back to normal
 * top-to-bottom ordering automatically.
 */

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function groupIntoLines(items) {
  const sorted = items
    .filter((item) => cleanText(item.str))
    .map((item) => ({
      text: cleanText(item.str),
      x: Number(item.transform?.[4] || 0),
      y: Number(item.transform?.[5] || 0),
      width: Number(item.width || 0),
    }))
    .sort((a, b) => {
      if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
      return a.x - b.x;
    });

  const lines = [];

  for (const item of sorted) {
    const last = lines[lines.length - 1];

    if (!last || Math.abs(last.y - item.y) > 3) {
      lines.push({ y: item.y, items: [item] });
      continue;
    }

    last.items.push(item);
  }

  return lines.map((line) => {
    const parts = line.items.sort((a, b) => a.x - b.x);
    let text = "";
    let lastEnd = null;

    for (const item of parts) {
      if (lastEnd !== null && item.x - lastEnd > 2) {
        text += " ";
      }

      text += item.text;
      lastEnd = item.x + item.width;
    }

    return {
      text: cleanText(text),
      x: Math.min(...parts.map((item) => item.x)),
      right: Math.max(...parts.map((item) => item.x + item.width)),
      y: line.y,
    };
  });
}

function findColumnSplit(lines, pageWidth) {
  if (lines.length < 8) return null;

  const starts = [...new Set(lines.map((line) => Math.round(line.x)))].sort(
    (a, b) => a - b,
  );

  if (starts.length < 4) return null;

  let best = null;

  for (let i = 1; i < starts.length; i++) {
    const gap = starts[i] - starts[i - 1];

    if (gap < Math.max(40, pageWidth * 0.1)) continue;

    const split = (starts[i - 1] + starts[i]) / 2;
    const left = lines.filter((line) => line.x <= split);
    const right = lines.filter((line) => line.x > split);

    if (left.length < 4 || right.length < 4) continue;

    /*
     * Require meaningful vertical overlap between the two groups.
     * This prevents a single-column resume with a few centred headings
     * from being mistaken for a two-column layout.
     */
    let overlap = 0;

    for (const leftLine of left) {
      if (right.some((rightLine) => Math.abs(leftLine.y - rightLine.y) <= 4)) {
        overlap++;
      }
    }

    const overlapRatio = overlap / Math.min(left.length, right.length);

    if (overlapRatio < 0.35) continue;

    const candidate = { split, gap, left, right, overlapRatio };

    if (!best || candidate.gap > best.gap) {
      best = candidate;
    }
  }

  return best;
}

function orderPageLines(lines, pageWidth) {
  if (!lines.length) return [];

  const split = findColumnSplit(lines, pageWidth);

  if (!split) {
    return lines
      .sort((a, b) => {
        if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
        return a.x - b.x;
      })
      .map((line) => line.text)
      .filter(Boolean);
  }

  const left = split.left.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
    return a.x - b.x;
  });

  const right = split.right.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
    return a.x - b.x;
  });

  /*
   * For the common sidebar layout, the left column contains identity,
   * contact and skills while the right contains summary/experience.
   * Putting the left column first gives the parser a clean header.
   *
   * If the main column is on the left, the parser still works because
   * experience/education are detected structurally from date/degree
   * signals rather than depending on section order.
   */
  return [...left, ...right].map((line) => line.text).filter(Boolean);
}

async function renderResumePage(pageData) {
  const textContent = await pageData.getTextContent({
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  });

  const viewport = pageData.getViewport({ scale: 1 });
  const lines = groupIntoLines(textContent.items || []);

  return orderPageLines(lines, viewport.width || 600).join("\n");
}

async function extractResumeTextFromPdf(buffer) {
  const pdfParse = require("pdf-parse");

  const result = await pdfParse(buffer, {
    pagerender: renderResumePage,
  });

  return {
    text: result.text || "",
    pages: result.numpages || 0,
    textLength: result.text?.length || 0,
  };
}

module.exports = {
  extractResumeTextFromPdf,
  renderResumePage,
};
