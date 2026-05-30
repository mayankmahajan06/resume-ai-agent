const THEMES = {
  indigo: { accent: "#4338ca" },
  emerald: { accent: "#059669" },
  slate: { accent: "#334155" },
  burgundy: { accent: "#991b1b" },
  navy: { accent: "#1d4ed8" },
};

function parseSkills(s) {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function safe(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildCompactGridHTML(resumeData) {
  const theme = THEMES[resumeData.selectedTheme] || THEMES.indigo;
  const skills = parseSkills(resumeData.skills);

  /* SKILLS */
  const skillsHTML = skills.length
    ? `
  <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f1f5f9;">
    <h3 style="margin:0 0 12px;color:${theme.accent};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Skills</h3>
    <div style="display:flex;flex-wrap:wrap;gap:7px;">
      ${skills.map((s) => `<span style="padding:4px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;color:${theme.accent};font-size:11px;font-weight:600;white-space:nowrap;">${safe(s)}</span>`).join("")}
    </div>
  </div>`
    : "";

  /* CERTIFICATIONS */
  const certs = (resumeData.certifications || []).filter(
    (c) => c.certificationName && c.certificationName.trim(),
  );
  const certsHTML = certs.length
  ? `
    <div style="margin-top:16px;margin-bottom:12px;">
    <h3 style="
        margin:0 0 12px;
        color:${theme.accent};
        font-size:11px;
        font-weight:700;
        letter-spacing:1.2px;
        text-transform:uppercase;
    ">
        Certifications
    </h3>

    <div style="
        display:flex;
        flex-wrap:wrap;
        gap:8px;
    ">

        ${certs.map((c) => `
        <span style="
            padding:6px 10px;
            border-radius:999px;
            background:${theme.card || "#f8fafc"};
            border:1px solid #e2e8f0;
            color:${theme.accent};
            font-size:11px;
            font-weight:700;
        ">
            ${safe(c.certificationName)}
        </span>
        `).join("")}

    </div>
    </div>`: "";

  /* EDUCATION */
  const eduHTML = resumeData.education.length
  ? `
    <div style="margin-top:16px;margin-bottom:12px;">
    <h3 style="
        margin:0 0 12px;
        color:${theme.accent};
        font-size:11px;
        font-weight:700;
        letter-spacing:1.2px;
        text-transform:uppercase;
    ">
        Education
    </h3>

    ${resumeData.education
        .map(
        (e) => `
        <div style="margin-bottom:8px;">

        ${
            e.degree?.trim()
            ? `<div style="
                font-weight:700;
                font-size:13px;
                color:#111827;
                line-height:1.4;
                ">
                ${safe(e.degree)}
                </div>`
            : ""
        }

        <div style="
            font-size:12px;
            color:#64748b;
            line-height:1.5;
            margin-top:2px;
        ">
            ${e.college ? safe(e.college) : ""}
            ${e.graduationYear ? ` | ${safe(e.graduationYear)}` : ""}
            ${e.cgpa ? ` | CGPA: ${safe(e.cgpa)}` : ""}
        </div>

        </div>
    `
        )
        .join("")}

    </div>`: "";

  /* EXPERIENCE */
  const exps = (resumeData.experiences || []).filter(
    (e) =>
      (e.role && e.role.trim()) ||
      (e.company && e.company.trim()) ||
      (e.responsibilities && e.responsibilities.trim()),
  );
  const expHTML = exps.length
    ? `
  <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f1f5f9;">
    <h3 style="margin:0 0 14px;color:${theme.accent};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Experience</h3>
    ${exps
      .map(
        (e) => `
    <div style="position:relative;padding-left:20px;margin-bottom:18px;border-left:2px solid #e2e8f0;">
      <div style="position:absolute;left:-6px;top:6px;width:10px;height:10px;border-radius:50%;background:${theme.accent};-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:5px;">
        <div>
          ${e.role ? `<div style="font-size:15px;font-weight:800;color:#111827;line-height:1.3;">${safe(e.role)}</div>` : ""}
          ${e.company ? `<div style="font-size:12px;font-weight:700;color:${theme.accent};margin-top:2px;">${safe(e.company)}</div>` : ""}
        </div>
        ${e.duration ? `<div style="font-size:11px;font-weight:700;color:${theme.accent};white-space:nowrap;flex-shrink:0;">${safe(e.duration)}</div>` : ""}
      </div>
      ${e.responsibilities ? `<div style="font-size:13px;color:#374151;line-height:1.75;">${safe(e.responsibilities).replace(/\n/g, "<br>")}</div>` : ""}
    </div>`,
      )
      .join("")}
  </div>`
    : "";

  /* PROJECTS */
  const projs = (resumeData.projects || []).filter(
    (p) =>
      (p.projectName && p.projectName.trim()) ||
      (p.description && p.description.trim()),
  );

    const projHTML = projs.length
        ? `
    <div style="margin-bottom:20px;">

    <div style="
        page-break-inside:avoid;
        break-inside:avoid;
    ">

        <h3 style="
        margin:0 0 14px;
        color:${theme.accent};
        font-size:11px;
        font-weight:700;
        letter-spacing:1.2px;
        text-transform:uppercase;
        ">
        Projects
        </h3>

        <div style="
        padding:14px 16px;
        margin-bottom:10px;
        border-left:4px solid ${theme.accent};
        border-radius:12px;
        background:#fff;
        page-break-inside:avoid;
        break-inside:avoid;
        ">

        ${
            projs[0].projectName
            ? `<div style="
                font-size:15px;
                font-weight:800;
                color:#111827;
                line-height:1.3;
                ">
                ${safe(projs[0].projectName)}
                </div>`
            : ""
        }

        ${
            projs[0].techStack
            ? `<div style="
                font-size:12px;
                font-weight:700;
                color:${theme.accent};
                margin-top:4px;
                ">
                ${safe(projs[0].techStack)}
                </div>`
            : ""
        }

        ${
            projs[0].description
            ? `<div style="
                font-size:13px;
                color:#374151;
                line-height:1.75;
                margin-top:8px;
                ">
                ${safe(projs[0].description)}
                </div>`
            : ""
        }

        </div>

    </div>

    ${projs
        .slice(1)
        .map(
        (p) => `
        <div style="
        padding:14px 16px;
        margin-bottom:10px;
        border-left:4px solid ${theme.accent};
        border-radius:12px;
        background:#fff;
        page-break-inside:avoid;
        break-inside:avoid;
        ">

        ${
            p.projectName
            ? `<div style="
                font-size:15px;
                font-weight:800;
                color:#111827;
                line-height:1.3;
                ">
                ${safe(p.projectName)}
                </div>`
            : ""
        }

        ${
            p.techStack
            ? `<div style="
                font-size:12px;
                font-weight:700;
                color:${theme.accent};
                margin-top:4px;
                ">
                ${safe(p.techStack)}
                </div>`
            : ""
        }

        ${
            p.description
            ? `<div style="
                font-size:13px;
                color:#374151;
                line-height:1.75;
                margin-top:8px;
                ">
                ${safe(p.description)}
                </div>`
            : ""
        }

        </div>
    `,
        )
        .join("")}

    </div>`: "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safe(resumeData.fullName)} Resume</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    html, body {
      background:#fff;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    @page { size:A4; margin:20px 0; }
  </style>
</head>
<body>
<div style="padding:28px 32px 2px 32px;background:#fff;">

  <!-- HEADER
       Using nested divs with explicit float instead of flex/table
       because Puppeteer's headless print context sometimes ignores
       both. Float is the oldest, most reliable layout for print. -->
  <div style="
    background:${theme.accent};
    border-radius:16px;
    padding:22px 26px;
    margin-bottom:22px;
    overflow:hidden;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  ">
    <!-- left: name + role -->
    <div style="float:left;">
      ${resumeData.fullName ? `<div style="font-size:30px;font-weight:800;color:#fff;line-height:1.15;">${safe(resumeData.fullName)}</div>` : ""}
      ${resumeData.currentRole ? `<div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.9);margin-top:5px;">${safe(resumeData.currentRole)}</div>` : ""}
    </div>
    <!-- right: contact details -->
    <div style="float:right;text-align:right;color:rgba(255,255,255,0.9);font-size:12px;line-height:1.9;">
      ${resumeData.location ? `<div>${safe(resumeData.location)}</div>` : ""}
      ${resumeData.phone ? `<div>${safe(resumeData.phone)}</div>` : ""}
      ${resumeData.email ? `<div>${safe(resumeData.email)}</div>` : ""}
      ${resumeData.linkedIn ? `<div>${safe(resumeData.linkedIn)}</div>` : ""}
    </div>
    <!-- clearfix -->
    <div style="clear:both;"></div>
  </div>

  ${
  resumeData.summary
    ? `
<div style="
  padding:18px 20px;
  margin-bottom:24px;
  background:linear-gradient(
    135deg,
    rgba(255,255,255,0.9),
    var(--card)
  );
  border-radius:14px;
  position:relative;
  overflow:hidden;
">

  <div style="
    position:absolute;
    left:0;
    top:0;
    bottom:0;
    width:4px;
    background:${theme.accent};
  "></div>

  <div style="
    margin-bottom:10px;
    color:${theme.accent};
    font-size:11px;
    font-weight:700;
    letter-spacing:1.2px;
    text-transform:uppercase;
  ">
    Professional Summary
  </div>

  <p style="
    margin:0;
    line-height:1.75;
    color:#374151;
    font-size:13px;
  ">
    ${safe(resumeData.summary)}
  </p>

</div>`
    : ""
}

  ${skillsHTML}
  ${expHTML}
  ${projHTML}
  ${eduHTML}
  ${certsHTML}

</div>
</body>
</html>`;
}

module.exports = { buildCompactGridHTML };
