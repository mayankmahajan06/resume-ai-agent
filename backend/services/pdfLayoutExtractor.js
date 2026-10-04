/*
 * Layout-aware PDF text extraction for resume imports.
 *
 * pdf-parse v1 exposes PDF.js page objects through its pagerender callback.
 * We use text item x/y coordinates to rebuild lines without merging text
 * from separate columns that happens to share the same vertical position.
 */

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function sortItems(items = []) {
  return [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
    return a.x - b.x;
  });
}

function buildLines(items = []) {
  const sorted = sortItems(items);
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
    const parts = [...line.items].sort((a, b) => a.x - b.x);
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

function findItemColumnSplit(items, pageWidth) {
  if (items.length < 12) return null;

  const starts = [
    ...new Set(items.map((item) => Math.round(item.x))),
  ].sort((a, b) => a - b);

  if (starts.length < 6) return null;

  let best = null;

  for (let i = 1; i < starts.length; i++) {
    const gap = starts[i] - starts[i - 1];

    if (gap < Math.max(40, pageWidth * 0.1)) continue;

    const split = (starts[i - 1] + starts[i]) / 2;
    const left = items.filter((item) => item.x <= split);
    const right = items.filter((item) => item.x > split);

    if (left.length < 8 || right.length < 8) continue;

    const leftY = new Set(left.map((item) => Math.round(item.y)));
    const rightY = new Set(right.map((item) => Math.round(item.y)));

    let overlap = 0;

    for (const y of leftY) {
      if ([...rightY].some((otherY) => Math.abs(y - otherY) <= 4)) {
        overlap++;
      }
    }

    const overlapRatio =
      overlap / Math.min(leftY.size, rightY.size);

    if (overlapRatio < 0.2) continue;

    const candidate = {
      split,
      gap,
      left,
      right,
      overlapRatio,
    };

    if (!best || candidate.gap > best.gap) {
      best = candidate;
    }
  }

  return best;
}

function isDateLikeLine(text = "") {
  return /(?:19|20)\\d{2}[-/]\\d{1,2}\\s*(?:-|–|—|to)\\s*(?:(?:19|20)\\d{2}[-/]\\d{1,2}|Present|Current|Now)\\b/i.test(
    cleanText(text),
  );
}

function isDateColumn(lines = []) {
  if (!lines.length) return false;

  const dateCount = lines.filter((line) => isDateLikeLine(line.text)).length;

  // A narrow left column containing mostly job dates is part of the main
  // experience layout, not a sidebar. Those dates must stay beside the
  // corresponding role/bullets when the text is flattened.
  return dateCount >= 2 && dateCount / lines.length >= 0.45;
}

function interleaveColumns(leftLines = [], rightLines = []) {
  const all = [...leftLines, ...rightLines].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
    return a.x - b.x;
  });

  return all;
}

function groupIntoLines(items, pageWidth) {
  const split = findItemColumnSplit(items, pageWidth);

  if (!split) {
    return buildLines(items);
  }

  const leftLines = buildLines(split.left);
  const rightLines = buildLines(split.right);

  /*
   * Two common resume layouts need different reading orders:
   *
   * 1. Sidebar + main content:
   *    name/contact/skills on the left, summary/experience on the right.
   *    Keep the sidebar together first.
   *
   * 2. Date rail + main content:
   *    dates on the left and role/company/bullets on the right.
   *    Interleave by Y so "2025-01 - Present" stays with "Engineer III".
   */
  if (isDateColumn(leftLines)) {
    return interleaveColumns(leftLines, rightLines);
  }

  return [...leftLines, ...rightLines];
}

async function renderResumePage(pageData) {
  const textContent = await pageData.getTextContent({
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  });

  const viewport = pageData.getViewport({ scale: 1 });
  const lines = groupIntoLines(
    (textContent.items || [])
      .filter((item) => cleanText(item.str))
      .map((item) => ({
        text: cleanText(item.str),
        x: Number(item.transform?.[4] || 0),
        y: Number(item.transform?.[5] || 0),
        width: Number(item.width || 0),
      })),
    viewport.width || 600,
  );

  return lines.map((line) => line.text).filter(Boolean).join("\n");
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
