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

  /*
   * Resume PDFs often have an indented main column. Looking only at the
   * largest gap between item start positions is unreliable because a main
   * column may start at x=199 while role/bullet text starts at x=289.
   *
   * Instead, build a horizontal occupancy map from the actual text boxes and
   * find a real empty vertical gutter between two populated regions.
   */
  const binSize = 4;
  const binCount = Math.ceil(pageWidth / binSize);
  const occupied = new Array(binCount).fill(false);

  for (const item of items) {
    const startBin = Math.max(0, Math.floor(item.x / binSize));
    const endBin = Math.min(
      binCount - 1,
      Math.ceil((item.x + item.width) / binSize),
    );

    for (let i = startBin; i <= endBin; i++) {
      occupied[i] = true;
    }
  }

  const gaps = [];
  let gapStart = -1;

  for (let i = 0; i <= binCount; i++) {
    const empty = i < binCount ? !occupied[i] : false;

    if (empty && gapStart === -1) {
      gapStart = i;
    }

    if (!empty && gapStart !== -1) {
      const gapEnd = i;
      const gapWidth = (gapEnd - gapStart) * binSize;

      if (gapWidth >= 18) {
        const leftX = gapStart * binSize;
        const rightX = gapEnd * binSize;

        if (
          leftX > pageWidth * 0.08 &&
          rightX < pageWidth * 0.92
        ) {
          gaps.push({
            gapWidth,
            split: (leftX + rightX) / 2,
          });
        }
      }

      gapStart = -1;
    }
  }

  if (!gaps.length) return null;

  gaps.sort((a, b) => b.gapWidth - a.gapWidth);

  for (const gap of gaps) {
    const left = items.filter((item) => item.x < gap.split);
    const right = items.filter((item) => item.x >= gap.split);

    if (left.length < 8 || right.length < 8) continue;

    const leftLines = buildLines(left);
    const rightLines = buildLines(right);

    const leftY = new Set(leftLines.map((line) => Math.round(line.y)));
    const rightY = new Set(rightLines.map((line) => Math.round(line.y)));

    let overlap = 0;

    for (const y of leftY) {
      if ([...rightY].some((otherY) => Math.abs(y - otherY) <= 4)) {
        overlap++;
      }
    }

    const overlapRatio =
      overlap / Math.min(leftY.size, rightY.size);

    if (overlapRatio < 0.08) continue;

    return {
      split: gap.split,
      gap: gap.gapWidth,
      left,
      right,
      overlapRatio,
    };
  }

  return null;
}

function isDateLikeLine(text = "") {
  const value = cleanText(text);

  return (
    /(?:19|20)\\d{2}[-/]\\d{1,2}\\s*(?:-|–|—|to)\\s*(?:(?:19|20)\\d{2}[-/]\\d{1,2}|Present|Current|Now)\\b/i.test(
      value,
    ) ||
    /\\d{1,2}[-/]\\d{4}\\s*(?:-|–|—|to)\\s*(?:\\d{1,2}[-/]\\d{4}|Present|Current|Now)\\b/i.test(
      value,
    ) ||
    /(?:19|20)\\d{2}\\s*(?:-|–|—|to)\\s*(?:(?:19|20)\\d{2}|Present|Current|Now)\\b/i.test(
      value,
    )
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
