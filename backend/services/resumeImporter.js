const skillMapping = require("../constants/skill-mapping");
const generalSkills = require("../constants/general-skill-mapping");

const SECTION_ALIASES = {
  skills: [
    "skills",
    "technical skills",
    "core skills",
    "competencies",
    "core competencies",
    "expertise",
  ],
  education: ["education", "academic background", "academics"],
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "career history",
    "work history",
  ],
  projects: ["projects", "project experience", "academic projects"],
  certifications: ["certifications", "certification", "certificates"],
};

const SECTION_NAMES = Object.values(SECTION_ALIASES).flat();

function isDateRange(line = "") {
  return (
    /\d{4}-\d{2}\s*-\s*(Current|Present|\d{4}-\d{2})/i.test(line) ||
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[–-]\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i.test(
      line,
    )
  );
}

function scoreRole(line = "") {
  let score = 0;

  if (
    /engineer|developer|lead|architect|manager|trainer|coordinator|analyst|teacher|consultant|officer|supervisor|intern|specialist/i.test(
      line,
    )
  ) {
    score += 50;
  }

  if (line.length < 100) score += 10;

  if (/highlights|skills|education|projects/i.test(line)) score -= 100;

  return score;
}

function scoreCompany(line = "") {
  let score = 0;

  if (
    /technologies|solutions|foundation|school|university|global|reuters|labs|systems|inc|ltd|limited|pvt/i.test(
      line,
    )
  ) {
    score += 50;
  }

  if (line.includes(",")) score += 15;

  if (/highlights|skills|education|projects/i.test(line)) score -= 100;

  return score;
}

function scoreCandidate(value = "", rules = []) {
  let score = 0;

  rules.forEach((rule) => {
    if (rule.test(value)) {
      score += rule.score;
    }
  });

  return score;
}

function normalizeText(text = "") {
  return text
    .replace(/\.c\s*\n\s*om/gi, ".com")
    .replace(/\.o\s*\n\s*rg/gi, ".org")
    .replace(/\.n\s*\n\s*et/gi, ".net")
    .replace(/\.i\s*\n\s*n/gi, ".in")
    .trim();
}

function splitLines(text = "") {
  return normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isSectionHeading(line = "") {
  const normalized = line.toLowerCase().replace(/[:\-]/g, "").trim();
  return SECTION_NAMES.includes(normalized);
}

function findSectionKey(line = "") {
  const normalized = line.toLowerCase().replace(/[:\-]/g, "").trim();

  return Object.entries(SECTION_ALIASES).find(([, aliases]) =>
    aliases.includes(normalized),
  )?.[0];
}

function groupSections(lines) {
  const sections = {};
  let activeSection = "header";

  sections[activeSection] = [];

  lines.forEach((line) => {
    const sectionKey = findSectionKey(line);

    if (sectionKey) {
      activeSection = sectionKey;
      sections[activeSection] = sections[activeSection] || [];
      return;
    }

    sections[activeSection].push(line);
  });

  return sections;
}

function extractEmail(text = "") {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  return match ? match[0] : "";
}

function extractPhone(text) {
  return (
    text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.replace(/\s{2,}/g, " ") || ""
  );
}

function extractName(lines = []) {
  const candidates = [];

  const topLines = lines.slice(0, 15);

  topLines.forEach((line, index) => {
    const text = line.trim();

    if (!text) return;

    let score = 0;

    // 2-4 words
    if (/^[A-Za-z]+(?:\s+[A-Za-z]+){1,3}$/.test(text)) score += 30;

    // ALL CAPS names
    if (/^[A-Z]+(?:\s+[A-Z]+){1,3}$/.test(text)) score += 25;

    // Near top
    if (index < 5) score += 20;

    // Bad words
    if (
      /experience|education|skills|professional|highlights|contact|phone|email|linkedin/i.test(
        text,
      )
    ) {
      score -= 50;
    }

    // Role words
    if (
      /engineer|developer|manager|trainer|coordinator|lead|architect/i.test(
        text,
      )
    ) {
      score -= 30;
    }

    candidates.push({
      text,
      score,
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  return candidates[0]?.score > 0 ? candidates[0].text : "";
}

function cleanBullet(line = "") {
  return line.replace(/^[•*·\-\u2022]\s*/, "").trim();
}

function extractSkillsFromResume(text = "") {
  const matchedSkills = [];

  const combinedSkills = {
    ...skillMapping,
    ...generalSkills,
  };

  Object.values(combinedSkills).forEach((skill) => {
    const found = skill.aliases.some((alias) => {
      const regex = new RegExp(
        `\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i",
      );

      return regex.test(text);
    });

    if (found) {
      matchedSkills.push(skill.label);
    }
  });

  return [...new Set(matchedSkills)].join(", ");
}

function splitEntries(lines = []) {
  const entries = [];
  let current = [];

  lines.forEach((line) => {
    const cleaned = cleanBullet(line);

    if (!cleaned) {
      return;
    }

    const startsNewEntry =
      current.length > 0 &&
      (/^\d{4}\b/.test(cleaned) ||
        /\b(19|20)\d{2}\b/.test(cleaned) ||
        /^[A-Z][A-Za-z0-9&., ]{2,}$/.test(cleaned));

    if (startsNewEntry && current.join(" ").length > 80) {
      entries.push(current);
      current = [];
    }

    current.push(cleaned);
  });

  if (current.length) {
    entries.push(current);
  }

  return entries;
}

function parseEducation(lines = []) {
  const degreePattern =
    /\b(B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|B\.?Sc|M\.?Sc|BCA|MCA|MBA|B\.?Ed|M\.?Ed|M\.?A|B\.?A|Bachelor|Master|PhD|Diploma)\b/i;

  lines = lines.filter(
    (line) =>
      !/^(technical skills|skills|achievements|additional information|personal details)$/i.test(
        line.trim(),
      ),
  );
  return splitEntries(lines).map((entry) => {
    const text = entry.join(" ");
    const degree =
      entry.find((line) => degreePattern.test(line)) || entry[0] || "";
    const graduationYear = text.match(/\b(19|20)\d{2}\b/)?.[0] || "";
    const cgpa = text.match(/\b(?:CGPA|GPA)[:\s]*([0-9.]+)/i)?.[1] || "";
    const college =
      entry.find(
        (line) =>
          line !== degree && !degreePattern.test(line) && !/^\d{4}$/.test(line),
      ) || "";

    return {
      degree,
      college,
      graduationYear,
      cgpa,
    };
  });
}

function parseEducationV2(lines = []) {
  const education = [];

  const degreeRegex =
    /(Bachelor|Master|B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|BCA|MCA|MBA|B\.?Sc|M\.?Sc|B\.?Ed|M\.?Ed|B\.?A|M\.?A|Diploma)/i;

  for (let i = 0; i < lines.length; i++) {
    const current = cleanBullet(lines[i]);

    if (!degreeRegex.test(current)) continue;

    let degree = current;
    while (i + 1 < lines.length) {
      const nextLine = cleanBullet(lines[i + 1]);

      // Stop if next line is obviously not part of degree
      if (
        degreeRegex.test(nextLine) ||
        nextLine.includes("University") ||
        /\b(19|20)\d{2}\b/.test(nextLine) ||
        nextLine.toLowerCase().includes("technical skills") ||
        nextLine.toLowerCase().includes("skills")
      ) {
        break;
      }

      degree += " " + nextLine;
      i++;
    }

    let college = "";
    let graduationYear = "";

    // Look ahead for college and year
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const next = cleanBullet(lines[j]);

      if (!college && !degreeRegex.test(next)) {
        college = next.replace(/[-–]\s*\d{4}/, "").trim();
      }

      const yearMatch = next.match(/\b(19|20)\d{2}\b/);

      if (yearMatch) {
        graduationYear = yearMatch[0];
      }
    }

    // Cleanup
    degree = degree.replace(/^\s*/, "").trim();
    college = college.replace(/^\s*/, "").trim();

    education.push({
      degree,
      college,
      graduationYear,
      cgpa: "",
    });
  }

  return education;
}

function parseExperience(lines = []) {
  return splitEntries(lines).map((entry) => {
    const text = entry.join(" ");
    const duration =
      text.match(
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*\.?\s?\d{4}\s*[-–]\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*\.?\s?\d{4})/i,
      )?.[0] ||
      text.match(
        /\b(19|20)\d{2}\s*[-–]\s*(Present|Current|(19|20)\d{2})\b/i,
      )?.[0] ||
      "";

    const [first = "", second = "", ...rest] = entry;
    const roleCompanyParts = first.split(/\s+[-|]\s+/);

    return {
      role: roleCompanyParts[0] || first,
      company: roleCompanyParts[1] || second,
      duration,
      responsibilities: rest.length
        ? rest.join("\n")
        : entry.slice(1).join("\n"),
    };
  });
}

function parseExperienceV2(lines = []) {
  const experiences = [];

  for (let i = 0; i < lines.length; i++) {
    const duration = lines[i];

    if (!isDateRange(duration)) continue;

    let previous = "";
    let previous2 = "";

    // Find previous non-empty line
    let p = i - 1;
    while (p >= 0) {
      if (lines[p].trim()) {
        previous = lines[p].trim();
        break;
      }
      p--;
    }

    // Find second previous non-empty line
    p--;
    while (p >= 0) {
      if (lines[p].trim()) {
        previous2 = lines[p].trim();
        break;
      }
      p--;
    }

    let role = "";
    let company = "";

    if (previous.includes("–")) {
      const idx = previous.lastIndexOf("–");

      if (idx > 0) {
        role = previous.substring(0, idx).trim();
        company = previous.substring(idx + 1).trim();
      }
    }

    if (!role) {
      role = previous2;
      company = previous;
    }

    // Safety cleanup

    if (/key highlights/i.test(role)) role = "";

    if (/key highlights/i.test(company)) company = "";

    const responsibilities = [];

    for (let j = i + 1; j < lines.length; j++) {
      const current = lines[j].trim();

      if (!current) continue;

      // PDF icon artifacts / contact block
      if (
        /📞||☎|✉|^\+91/.test(current) ||
        current.includes("") ||
        current.includes("☎") ||
        current.includes("✉") ||
        current.startsWith("+91") ||
        /^[+]?\d[\d\s()-]{8,}$/.test(current) ||
        current.toLowerCase().includes("@") ||
        current.toLowerCase().includes("linkedin") ||
        current.toLowerCase().includes("github") ||
        current.toLowerCase().includes("languages known") ||
        current.toLowerCase().includes("date of birth") ||
        current.toLowerCase().includes("passport")
      ) {
        break;
      }

      // Next experience
      if (isDateRange(current)) break;

      // Next major section
      if (
        /^(education|technical skills|skills|projects|certifications|achievements|additional information|personal details|core competencies)$/i.test(
          current,
        )
      ) {
        break;
      }

      // Skip heading
      if (/^key highlights:?$/i.test(current)) continue;

      // If another obvious role appears, stop
      if (scoreRole(current) >= 50 && responsibilities.length > 2) {
        break;
      }

      if (
        /^[A-Za-z].*(–|-).*(Foundation|School|University|Ministry|Technologies|Solutions|Global|Ltd|Inc|Corporation|Company|Institute|College)/i.test(
          current,
        )
      ) {
        break;
      }

      // Stop if contact details start appearing
      if (
        current.includes("📞") ||
        current.includes("") ||
        current.toLowerCase().includes("linkedin") ||
        current.toLowerCase().includes("github") ||
        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(current) ||
        /^\+?\d[\d\s\-()]{8,}$/.test(current)
      ) {
        break;
      }

      responsibilities.push(current);
    }

    experiences.push({
      role,
      company,
      duration,
      responsibilities: responsibilities.join("\n"),
    });
  }

  return experiences;
}

function parseProjects(lines = []) {
  return splitEntries(lines).map((entry) => {
    const [projectName = "", ...details] = entry;
    const description = details.join("\n");
    const techStack =
      description.match(/(?:tech stack|technologies|tools)[:\s]+(.+)/i)?.[1] ||
      "";

    return {
      projectName,
      techStack,
      description,
    };
  });
}

function parseCertifications(lines = []) {
  return lines
    .map(line => cleanBullet(line))
    .filter(Boolean)
    .filter(
      line =>
        !/hobbies|interests|languages|personal/i.test(line)
    )
    .map(certificationName => ({
      certificationName
    }));
}

function parseResumeText(text = "") {
  const normalizedText = normalizeText(text);
  const lines = splitLines(normalizedText);
  const sections = groupSections(lines);
  const email = extractEmail(normalizedText);
  const phone = extractPhone(normalizedText);
  const fullName = extractName(lines);
  const summary =
    sections.header
      ?.filter((line) => line !== fullName)
      .filter((line) => line !== email)
      .filter((line) => line !== phone)
      .filter((line) => !line.includes("@"))
      .filter((line) => !/https?:\/\//i.test(line))
      .slice(0, 3)
      .join(" ") || "";

  return {
    fullName,
    email,
    phone,
    location: "",
    linkedIn:
      normalizedText.match(
        /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[^\s]+/i,
      )?.[0] ||
      normalizedText.match(
        /(https?:\/\/)?(www\.)?linkedin\.com\/[^\s]+/i,
      )?.[0] ||
      "",
    currentRole: "",
    targetRole: "",
    summary,
    selectedTheme: "indigo",
    selectedTemplate: "modern",
    resumeId: "",
    jdMatch: 0,
    atsScore: 0,
    skills: extractSkillsFromResume(normalizedText),
    experiences: parseExperience(lines),
    projects: parseProjects(sections.projects || []),
    certifications: parseCertifications(sections.certifications || []),
    education: parseEducation(sections.education || []),
  };
}

module.exports = {
  parseResumeText,
};
