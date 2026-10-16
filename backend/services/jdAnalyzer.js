const skillMapping =
  require('../constants/skill-mapping');

function normalizeText(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s/#.+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Match aliases as complete terms rather than arbitrary substrings.
// Punctuation within aliases (e.g. Node.js and CI/CD) remains significant.
function containsAlias(normalizedText, alias) {
  const normalizedAlias = normalizeText(alias);
  if (!normalizedAlias) return false;

  // Short aliases must not match inside words or technology suffixes.
  if (normalizedAlias === 'js' || normalizedAlias === 'ts') {
    const shortAliasPattern = new RegExp(
      `(^|[^a-z0-9.])${normalizedAlias}(?=$|[^a-z0-9])`,
      'i'
    );
    return shortAliasPattern.test(normalizedText);
  }

  // AngularJS / Angular.js / Angular 1 are not modern Angular.
  // Angular Material is a separate skill and must not imply Angular.
  if (normalizedAlias === 'angular') {
    const angularPattern = /(^|[^a-z0-9])angular(?!js|\.js|\s*1(?:\b|\.|\+)|\s+material|\/material)(?=$|[^a-z0-9])/i;
    return angularPattern.test(normalizedText);
  }

  const escapedAlias = normalizedAlias.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapedAlias}(?=$|[^a-z0-9])`,
    'i'
  );

  return pattern.test(normalizedText);
}

function extractSkills(text = '') {
  const normalizedText = normalizeText(text);
  const detectedSkills = [];

  Object.entries(skillMapping).forEach(([key, skillData]) => {
    const aliases = Array.isArray(skillData.aliases)
      ? skillData.aliases
      : [];

    if (aliases.some(alias => containsAlias(normalizedText, alias))) {
      detectedSkills.push({ key, label: skillData.label });
    }
  });

  return detectedSkills;
}

function uniqueSkills(skills = []) {
  const map = new Map();
  skills.forEach(skill => map.set(skill.key, skill));
  return Array.from(map.values());
}

const REQUIRED_MARKERS = [
  /\bmust[- ]have\b/i,
  /\bmust have\b/i,
  /\brequired\b/i,
  /\bmandatory\b/i,
  /\bessential\b/i,
  /\bminimum qualifications?\b/i,
  /\bneed to have\b/i,
  /\byou must\b/i,
];

// Only mark a skill as required when explicit requirement wording appears in
// the same line/sentence as that skill. We do not infer priority from the
// overall job title or from a generic "Requirements" heading.
function isExplicitlyRequired(skill, jobDescription) {
  const text = String(jobDescription || '');
  const segments = text
    .split(/[\n;!?]+|(?<=[.!?])\s+/)
    .map(segment => segment.trim())
    .filter(Boolean);
  const aliases = skillMapping[skill.key]?.aliases || [];

  const explicitlyMarked = segments.some(segment =>
    REQUIRED_MARKERS.some(marker => marker.test(segment)) &&
    aliases.some(alias => containsAlias(normalizeText(segment), alias))
  );
  if (explicitlyMarked) return true;

  // A skill listed under an explicit "Required Skills" section counts as required.
  // Generic "Requirements" headings are intentionally not treated as required.
  const lines = text.split(/\r?\n/);
  let inRequiredSkillsSection = false;
  for (const line of lines) {
    const heading = line.trim().replace(/^#+\s*/, '').replace(/[:*]+$/, '').trim();
    if (/^required skills$/i.test(heading)) {
      inRequiredSkillsSection = true;
      continue;
    }
    if (/^(preferred skills|nice to have|bonus skills|what you will do|responsibilities|qualifications|experience|education)$/i.test(heading)) {
      inRequiredSkillsSection = false;
    }
    if (inRequiredSkillsSection && aliases.some(alias => containsAlias(normalizeText(line), alias))) {
      return true;
    }
  }
  return false;
}

const COMMON_NON_SKILL_TERMS = new Set(
  'the and for with from that this are you your our their job role team work years year experience experienced required preferred responsibilities responsibility skills skill ability strong excellent good knowledge familiarity understanding develop maintain build building using including candidate developer development applications application support design implement integrate write test testing debugging performance production collaborate frontend backend modern legacy scalable services service unit integration automated system data database cloud tools platform software engineering engineer architecture related based business computer science bachelor degree or to of in on a an as at by is be it we have has had can able not etc agile nice must should will plus'.split(' ')
);

const MAPPED_ALIAS_TOKENS = new Set(
  Object.values(skillMapping)
    .flatMap(skill => skill.aliases || [])
    .flatMap(alias => normalizeText(alias).split(' '))
);

function detectUnmappedTerms(jobDescription) {
  const candidates = [];
  const tokens = String(jobDescription || '').match(/[A-Za-z][A-Za-z0-9+#./-]{1,}/g) || [];

  for (const token of tokens) {
    const cleanToken = token.replace(/[.,;:!?]+$/, '');
    const lower = cleanToken.toLowerCase();

    if (COMMON_NON_SKILL_TERMS.has(lower) || MAPPED_ALIAS_TOKENS.has(lower)) continue;

    // Conservative review aid: only report acronym/product-like tokens.
    const looksTechnical =
      /^[A-Z][A-Z0-9+#./-]{1,}$/.test(cleanToken) ||
      /[+#./0-9-]/.test(cleanToken) ||
      /^(Hibernate|Mockito|Maven|JUnit|JPA|JDBC|Gradle|Lombok|Tomcat)$/i.test(cleanToken);

    if (looksTechnical) candidates.push(cleanToken);
  }

  return [...new Set(candidates)].slice(0, 30);
}

function analyzeJD(resumeData, jobDescription) {
  const safeResume = resumeData && typeof resumeData === 'object' && !Array.isArray(resumeData)
    ? resumeData
    : {};

  const experiences = Array.isArray(safeResume.experiences)
    ? safeResume.experiences
    : [];
  const projects = Array.isArray(safeResume.projects)
    ? safeResume.projects
    : [];
  const education = Array.isArray(safeResume.education)
    ? safeResume.education
    : [];
  const certifications = Array.isArray(safeResume.certifications)
    ? safeResume.certifications
    : [];

  const textValue = value =>
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';

  const resumeText = `
    ${textValue(safeResume.skills)}
    ${textValue(safeResume.summary)}
    ${experiences.map(exp => `
      ${textValue(exp?.role)}
      ${textValue(exp?.company)}
      ${textValue(exp?.responsibilities)}
    `).join(' ')}
    ${projects.map(project => `
      ${textValue(project?.projectName)}
      ${textValue(project?.techStack)}
      ${textValue(project?.description)}
    `).join(' ')}
    ${education.map(item => `
      ${textValue(item?.degree)}
      ${textValue(item?.fieldOfStudy)}
    `).join(' ')}
    ${certifications.map(item => textValue(item?.certificationName)).join(' ')}
  `;

  const jdSkills = uniqueSkills(extractSkills(jobDescription));
  const resumeSkills = uniqueSkills(extractSkills(resumeText));
  const resumeSkillKeys = new Set(resumeSkills.map(skill => skill.key));

  const analyzedSkills = jdSkills.map(skill => ({
    ...skill,
    matched: resumeSkillKeys.has(skill.key),
    required: isExplicitlyRequired(skill, jobDescription),
  }));

  const matchedSkills = analyzedSkills.filter(skill => skill.matched);
  const missingSkills = analyzedSkills.filter(skill => !skill.matched);
  const requiredSkills = analyzedSkills.filter(skill => skill.required);
  const missingRequiredSkills = requiredSkills.filter(skill => !skill.matched);
  const unrecognizedJdTerms = detectUnmappedTerms(jobDescription);

  // Preserve the general overlap score and make explicit requirement coverage visible.
  const score = jdSkills.length
    ? Math.round((matchedSkills.length / jdSkills.length) * 100)
    : 0;
  const requiredSkillMatchScore = requiredSkills.length
    ? Math.round(((requiredSkills.length - missingRequiredSkills.length) / requiredSkills.length) * 100)
    : null;

  return {
    jdMatchScore: score,
    scoreMethod: 'Recognized-skill overlap: matched recognized JD skills divided by all recognized JD skills. Required-skill coverage is reported separately.',
    recognizedSkillsCount: jdSkills.length,
    requiredSkillMatchScore,
    requiredSkills: requiredSkills.map(skill => skill.label),
    missingRequiredSkills: missingRequiredSkills.map(skill => skill.label),
    matchedSkills: matchedSkills.map(skill => skill.label),
    missingSkills: missingSkills.map(skill => skill.label),
    unrecognizedJdTerms,
  };
}

module.exports = analyzeJD;
