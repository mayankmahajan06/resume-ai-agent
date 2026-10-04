const skillMapping = require("../constants/skill-mapping");
const generalSkills = require("../constants/general-skill-mapping");

/*
 * Resume Importer V2
 *
 * PDF text extraction can lose visual reading order, especially for
 * two-column resumes. This parser uses structural signals (sections,
 * dates, degrees and contact patterns) instead of generic line splitting.
 *
 * AI fallback can be added later without changing the ResumeData contract.
 */

const SECTION_ALIASES = {
  summary: [
    "summary",
    "professional summary",
    "career summary",
    "profile",
    "professional profile",
    "about me",
    "objective",
    "career objective",
  ],
  skills: [
    "skills",
    "technical skills",
    "technical expertise",
    "core skills",
    "key skills",
    "competencies",
    "core competencies",
    "areas of expertise",
    "expertise",
    "technologies",
  ],
  education: [
    "education",
    "academic background",
    "academic qualifications",
    "academics",
    "educational qualifications",
    "education & certification",
  ],
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "professional history",
    "employment history",
    "career history",
    "work history",
    "career experience",
  ],
  projects: [
    "projects",
    "project experience",
    "academic projects",
    "key projects",
    "personal projects",
    "personal project",
  ],
  certifications: [
    "certifications",
    "certification",
    "certificates",
    "licenses & certifications",
    "licenses and certifications",
  ],
  achievements: [
    "achievements",
    "accomplishments",
    "awards",
    "honors",
  ],
};

const SECTION_NAMES = Object.values(SECTION_ALIASES).flat();

const STOP_HEADINGS = new Set([
  ...SECTION_NAMES,
  "hobbies",
  "hobbies and interests",
  "interests",
  "languages",
  "languages known",
  "personal details",
  "additional information",
  "references",
]);

const MONTHS =
  "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December";

function normalizeText(text = "") {
  return String(text)
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\u2028|\u2029/g, "\n")
    .replace(/\.c\s*\n\s*om/gi, ".com")
    .replace(/\.o\s*\n\s*rg/gi, ".org")
    .replace(/\.n\s*\n\s*et/gi, ".net")
    .replace(/\.i\s*\n\s*n/gi, ".in")
    .replace(/(linkedin\.com|github\.com)\s*\n\s*/gi, "$1/")
    .replace(/https?:\/\/\s+/gi, "https://")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLine(line = "") {
  return String(line).replace(/\s+/g, " ").trim();
}

function splitLines(text = "") {
  const rawLines = normalizeText(text)
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const lines = [];

  for (let i = 0; i < rawLines.length; i++) {
    const current = rawLines[i];
    const next = rawLines[i + 1] || "";

    if (
      /(?:19|20)\d{2}[-/]\d{1,2}\s*[-–—]\s*$/.test(current) &&
      /^(?:Present|Current|Now|(?:19|20)\d{2}[-/]\d{1,2})$/i.test(next)
    ) {
      lines.push(current + " " + next);
      i++;
      continue;
    }

    lines.push(current);
  }

  return lines;
}

function cleanBullet(line = "") {
  return cleanLine(line)
    .replace(/^(?:[•●▪◦‣⁃∙·*]|)\s*/u, "")
    .replace(/^-\s+/, "")
    .trim();
}

function normalizeHeading(line = "") {
  return cleanLine(line)
    .toLowerCase()
    .replace(/[|:：]+$/g, "")
    .replace(/[-–—]+$/g, "")
    .trim();
}

function findSectionKey(line = "") {
  const normalized = normalizeHeading(line);

  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.includes(normalized)) return key;
  }

  return undefined;
}

function isStopHeading(line = "") {
  return STOP_HEADINGS.has(normalizeHeading(line));
}

function groupSections(lines = []) {
  const sections = { header: [] };
  let active = "header";

  for (const line of lines) {
    const key = findSectionKey(line);

    if (key) {
      active = key;
      sections[active] = sections[active] || [];
      continue;
    }

    sections[active] = sections[active] || [];
    sections[active].push(line);
  }

  return sections;
}

function extractEmail(text = "") {
  const normalized = normalizeText(text)
    // Some PDF fonts split the TLD across text items, e.g. gmail.c + om.
    .replace(/([A-Z0-9._%+-]+@[A-Z0-9.-]+)\s+([A-Z]{2,})\b/gi, "$1$2");

  const match = normalized.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );

  return match ? match[0].replace(/[),.;]+$/, "") : "";
}

function extractPhone(text = "") {
  const normalized = normalizeText(text);

  const labelled = normalized.match(
    /(?:phone|mobile|contact|tel|telephone)\s*[:\-]?\s*(\+?\d[\d\s().-]{8,}\d)/i,
  )?.[1];

  if (labelled) return labelled.trim();

  const candidates = normalized.match(/\+?\d[\d\s().-]{8,}\d/g) || [];

  return (
    candidates
      .map((value) => value.trim())
      .find((value) => value.replace(/\D/g, "").length >= 10) || ""
  );
}

function extractLinkedIn(text = "") {
  const normalized = normalizeText(text)
    .replace(/(linkedin\.com)\s*\n\s*/gi, "$1/");

  const match = normalized.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s<]+/i,
  );

  return match ? match[0].replace(/[),.;]+$/, "") : "";
}

function extractLocation(lines = []) {
  for (let i = 0; i < lines.length; i++) {
    if (!/^(address|location|based in|current location)\s*:?\s*$/i.test(lines[i])) {
      continue;
    }

    const next = lines[i + 1];

    if (
      next &&
      !isStopHeading(next) &&
      !/^(phone|mobile|email|e-mail|linkedin)$/i.test(next)
    ) {
      return next;
    }
  }

  return (
    lines.find(
      (line) =>
        /,\s*(india|usa|uk|canada|australia|singapore)\b/i.test(line) &&
        !/\d{4}-\d{2}/.test(line),
    ) || ""
  );
}

function looksLikeRole(line = "") {
  return /\b(engineer|developer|designer|architect|manager|lead|analyst|consultant|specialist|administrator|scientist|intern|director|officer|coordinator|executive|programmer|tester|qa)\b/i.test(
    line,
  );
}

function looksLikeContact(line = "") {
  return (
    /@/.test(line) ||
    /https?:\/\//i.test(line) ||
    /linkedin\.com|github\.com/i.test(line) ||
    /^(phone|mobile|contact|email|e-mail|address|location|linkedin)$/i.test(line) ||
    /^\+?\d[\d\s().-]{8,}\d$/.test(line)
  );
}

function looksLikeName(line = "") {
  const value = cleanLine(line);

  if (!value || value.length < 2 || value.length > 35) return false;
  if (looksLikeContact(value) || /[0-9,:;|]/.test(value)) return false;
  if (isStopHeading(value) || looksLikeRole(value)) return false;
  if (/[.!?]/.test(value)) return false;

  const words = value.split(/\s+/);

  if (words.length < 1 || words.length > 4) return false;
  if (words.some((word) => word.length > 18)) return false;

  return words.every((word) => /^[A-Za-z][A-Za-z'-]*$/.test(word));
}

function extractName(lines = []) {
  const top = lines.slice(0, 40);
  const candidates = [];

  for (let i = 0; i < top.length; i++) {
    const current = top[i];

    if (!looksLikeName(current)) continue;

    // PDF layouts sometimes put first and last name on separate lines.
    const next = top[i + 1] || "";

    if (looksLikeName(next)) {
      const combined = cleanLine(current + " " + next);

      if (combined.length <= 35) {
        candidates.push({
          value: combined,
          score: 120 - i,
          index: i,
        });
        i++;
        continue;
      }
    }

    const words = current.split(/\s+/);
    let score = 0;

    if (i < 10) score += 30;

    if (words.length === 2) score += 35;
    else if (words.length === 3) score += 25;
    else if (words.length === 1) score += 5;

    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/.test(current)) {
      score += 30;
    }

    const nearby = top.slice(i + 1, i + 8).join(" ");

    if (/@[A-Za-z0-9.-]+\./.test(nearby)) score += 25;
    if (/\b(phone|mobile|contact|email|e-mail|address|linkedin)\b/i.test(nearby)) {
      score += 20;
    }

    candidates.push({ value: current, score, index: i });
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  return candidates[0]?.value || "";
}

function extractDateRange(line = "") {
  const value = cleanLine(line);

  const patterns = [
    new RegExp(
      "(?:" +
        MONTHS +
        ")\\.?\\s+\\d{4}\\s*(?:-|–|—|to)\\s*(?:(?:" +
        MONTHS +
        ")\\.?\\s+\\d{4}|Present|Current|Now)",
      "i",
    ),
    /\b\d{4}[-/]\d{1,2}\s*(?:-|–|—|to)\s*(?:\d{4}[-/]\d{1,2}|Present|Current|Now)\b/i,
    /\b\d{1,2}[-/]\d{4}\s*(?:-|–|—|to)\s*(?:\d{1,2}[-/]\d{4}|Present|Current|Now)\b/i,
    /\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|Present|Current|Now)\b/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ").trim();
  }

  return "";
}

function isDateRange(line = "") {
  return Boolean(extractDateRange(line));
}

function isLikelyBulletText(line = "") {
  return (
    /^[•●▪◦‣⁃∙·*-]\s*/u.test(line) ||
    line.length > 70 ||
    /^(led|managed|developed|designed|implemented|created|built|improved|ensured|collaborated|worked|contributed|delivered|maintained|optimized|migrated|conducted|provided|supported|resolved|utilized|applied|gathered|identified|updated)\b/i.test(
      line,
    )
  );
}

function dedupeExperiences(experiences = []) {
  const seen = new Set();

  return experiences.filter((item) => {
    const key = [item.role, item.company, item.duration]
      .join("|")
      .toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseExperience(lines = []) {
  const experiences = [];

  for (let i = 0; i < lines.length; i++) {
    const duration = extractDateRange(lines[i]);

    if (!duration) continue;

    const currentLine = cleanBullet(lines[i] || "");
    const previous = cleanBullet(lines[i - 1] || "");
    const previous2 = cleanBullet(lines[i - 2] || "");

    let role = "";
    let company = "";

    // Some resumes keep role, company and dates on the same line:
    // "Engineer III, S&P Global 01/2025 - Present".
    const beforeDate = currentLine
      .replace(duration, "")
      .replace(/[-–—|]+\s*$/, "")
      .trim();

    if (beforeDate && !isDateRange(beforeDate) && looksLikeRole(beforeDate)) {
      const parts = beforeDate.split(",").map((part) => cleanLine(part)).filter(Boolean);

      role = parts[0] || beforeDate;
      company = parts.slice(1).join(", ");
    }

    if (previous && previous2) {
      if (looksLikeRole(previous2) && !looksLikeRole(previous)) {
        role = previous2;
        company = previous;
      } else if (looksLikeRole(previous) && !looksLikeRole(previous2)) {
        role = previous;
        company = previous2;
      } else {
        role = previous2;
        company = previous;
      }
    } else if (previous) {
      role = looksLikeRole(previous) ? previous : "";
      company = role ? "" : previous;
    }

    const combined = role.match(/^(.+?)\s+(?:-|–|—|\|)\s+(.+)$/);

    if (combined) {
      role = combined[1].trim();
      company = combined[2].trim();
    }

    // Some PDFs place role and company on one line, e.g.
    // "Engineer III, S&P Global" before the date.
    if (!company && role.includes(",")) {
      const parts = role.split(",").map((part) => cleanLine(part)).filter(Boolean);

      if (parts.length >= 2 && looksLikeRole(parts[0])) {
        role = parts[0];
        company = parts.slice(1).join(", ");
      }
    }

    const responsibilities = [];

    for (let j = i + 1; j < lines.length; j++) {
      const current = cleanLine(lines[j]);

      if (!current) continue;
      if (isDateRange(current)) break;
      if (isStopHeading(current)) break;
      if (/^key highlights:?$/i.test(current)) continue;
      if (looksLikeContact(current)) break;

      if (
        responsibilities.length >= 2 &&
        looksLikeRole(current) &&
        !isLikelyBulletText(current)
      ) {
        break;
      }

      responsibilities.push(cleanBullet(current));
    }

    if (role || company || responsibilities.length) {
      experiences.push({
        role: cleanLine(role),
        company: cleanLine(company),
        duration,
        responsibilities: responsibilities.filter(Boolean).join("\n"),
      });
    }
  }

  return dedupeExperiences(experiences);
}

const DEGREE_REGEX =
  /\b(B\.?\s?Tech|M\.?\s?Tech|B\.?\s?E\.?|M\.?\s?E\.?|B\.?\s?Sc|M\.?\s?Sc|BCA|MCA|MBA|B\.?\s?Ed|M\.?\s?Ed|B\.?\s?A|M\.?\s?A|B\.?\s?Com|M\.?\s?Com|Bachelor(?:'s)?|Master(?:'s)?|Ph\.?\s?D\.?|Diploma|Post Graduate Diploma)\b/i;

function parseEducation(lines = []) {
  const education = [];

  for (let i = 0; i < lines.length; i++) {
    const start = cleanBullet(lines[i]);

    if (!DEGREE_REGEX.test(start)) continue;

    const block = [start];

    for (let j = i + 1; j < lines.length && block.length < 6; j++) {
      const current = cleanBullet(lines[j]);

      if (!current) continue;
      if (DEGREE_REGEX.test(current) || isStopHeading(current)) break;

      block.push(current);
    }

    const text = block.join(" ");
    const year = text.match(/\b(?:19|20)\d{2}\b/)?.[0] || "";

    const college =
      block
        .slice(1)
        .find(
          (line) =>
            !/\b(?:19|20)\d{2}\b/.test(line) &&
            !/^(?:year|graduation year|percentage|cgpa|gpa)\b/i.test(line),
        ) || "";

    const score =
      text.match(
        /\b(?:CGPA|GPA|percentage|percent)[:\s-]*([0-9]+(?:\.[0-9]+)?%?)/i,
      )?.[1] || "";

    education.push({
      degree: start,
      college: cleanLine(college),
      graduationYear: year,
      cgpa: score,
    });

    i += block.length - 1;
  }

  return education;
}

function parseProjects(lines = []) {
  if (!lines.length) return [];

  const projects = [];
  let current = null;

  for (const rawLine of lines) {
    const line = cleanBullet(rawLine);
    if (!line) continue;

    if (!current) {
      current = {
        projectName: line,
        techStack: "",
        description: "",
      };
      continue;
    }

    const techMatch = line.match(
      /^(?:tech(?:nology)?\s*stack|technologies|tools|tech)\s*[:\-]\s*(.+)$/i,
    );

    if (techMatch) {
      current.techStack = techMatch[1].trim();
    } else {
      current.description = current.description
        ? current.description + "\n" + line
        : line;
    }
  }

  if (current?.projectName) projects.push(current);
  return projects;
}

function parseCertifications(lines = []) {
  const certifications = [];

  for (const rawLine of lines) {
    const line = cleanBullet(rawLine);
    if (!line) continue;

    if (/^(hobbies|hobbies and interests|interests|languages|languages known)$/i.test(line)) {
      break;
    }

    certifications.push({ certificationName: line });
  }

  return certifications;
}

function extractSkillsFromResume(text = "", skillLines = []) {
  const combinedSkills = {
    ...skillMapping,
    ...generalSkills,
  };

  const sources = [skillLines.join(" "), text].filter(Boolean);
  const matched = [];

  Object.values(combinedSkills).forEach((skill) => {
    const found = sources.some((source) =>
      skill.aliases.some((alias) => {
        const escaped = alias.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
        return new RegExp("\\b" + escaped + "\\b", "i").test(source);
      }),
    );

    if (found) matched.push(skill.label);
  });

  return [...new Set(matched)].join(", ");
}

function extractSummary(lines = []) {
  const firstDate = lines.findIndex((line) => isDateRange(line));
  const limit = firstDate >= 0 ? firstDate : Math.min(lines.length, 80);

  const candidates = [];
  let block = [];

  const flush = () => {
    const value = block.join(" ").trim();

    if (
      value.length >= 100 &&
      !looksLikeContact(value) &&
      !/^key highlights:?$/i.test(value)
    ) {
      candidates.push(value);
    }

    block = [];
  };

  for (let i = 0; i < limit; i++) {
    const line = cleanLine(lines[i]);

    if (
      isStopHeading(line) ||
      isDateRange(line) ||
      looksLikeContact(line) ||
      /^key highlights:?$/i.test(line)
    ) {
      flush();
      continue;
    }

    if (line.length < 35 && !/\b(and|or|with|the|of|to|in|for|a|an)\b/i.test(line)) {
      flush();
      continue;
    }

    if (looksLikeRole(line) && line.length < 70) {
      flush();
      continue;
    }

    block.push(line);
  }

  flush();

  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] || "";
}

function extractHeaderRole(headerLines = []) {
  for (const line of headerLines) {
    const value = cleanBullet(line);

    if (!value || looksLikeContact(value) || isStopHeading(value)) continue;

    // The first role-like header line is much safer than taking a role-like
    // sentence from the professional summary.
    if (looksLikeRole(value) && value.length <= 70) {
      return value;
    }
  }

  return "";
}

function parseResumeText(text = "") {
  const normalizedText = normalizeText(text);
  const lines = splitLines(normalizedText);
  const sections = groupSections(lines);

  /*
   * Do not restrict experience parsing to sections.experience.
   *
   * In two-column resumes the "Experience" heading can be physically placed
   * in the sidebar while the actual jobs are in the main column. Once the PDF
   * is flattened, those lines can belong to different structural sections.
   * Date ranges are a stronger signal, so parse experiences from the complete
   * ordered document.
   */
  const experiences = parseExperience(lines);
  const headerRole = extractHeaderRole(sections.header || []);

  return {
    fullName: extractName(lines),
    email: extractEmail(normalizedText),
    phone: extractPhone(normalizedText),
    location: extractLocation(lines),
    linkedIn: extractLinkedIn(normalizedText),
    currentRole: headerRole || experiences[0]?.role || "",
    targetRole: "",
    summary:
      sections.summary?.length
        ? sections.summary.join(" ").trim()
        : extractSummary(lines),
    selectedTheme: "indigo",
    selectedTemplate: "modern",
    resumeId: "",
    jdMatch: 0,
    atsScore: 0,
    skills: extractSkillsFromResume(normalizedText, sections.skills || []),
    experiences,
    projects: parseProjects(sections.projects || []),
    certifications: parseCertifications(
      sections.certifications?.length
        ? sections.certifications
        : lines.filter((line) =>
            /\b(?:certified|certification|certificate)\b/i.test(line),
          ),
    ),
    education: parseEducation(
      sections.education?.length ? sections.education : lines,
    ),
  };
}

module.exports = {
  parseResumeText,
};
