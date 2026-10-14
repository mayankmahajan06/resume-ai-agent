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
    const angularPattern = /(^|[^a-z0-9])angular(?!js|\.js|\s*1|\s+material|\/material)(?=$|[^a-z0-9])/i;
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
  const segments = String(jobDescription || '')
    .split(/[\n;!?]+|(?<=[.!?])\s+/)
    .map(segment => segment.trim())
    .filter(Boolean);

  return segments.some(segment =>
    REQUIRED_MARKERS.some(marker => marker.test(segment)) &&
    (skillMapping[skill.key]?.aliases || []).some(alias =>
      containsAlias(normalizeText(segment), alias)
    )
  );
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

  // Explicitly required skills carry 2 points; other recognized skills carry
  // 1. If the JD contains no explicit required markers, this naturally falls
  // back to the original equal-weight skill-overlap score.
  const totalWeight = analyzedSkills.reduce(
    (total, skill) => total + (skill.required ? 2 : 1),
    0
  );
  const matchedWeight = matchedSkills.reduce(
    (total, skill) => total + (skill.required ? 2 : 1),
    0
  );
  const score = totalWeight
    ? Math.round((matchedWeight / totalWeight) * 100)
    : 0;

  return {
    jdMatchScore: score,
    scoreMethod: requiredSkills.length
      ? 'Explicitly required skills count double; other recognized skills count once.'
      : 'Equal-weight overlap of recognized skills; no explicit required-skill wording was detected.',
    recognizedSkillsCount: jdSkills.length,
    requiredSkills: requiredSkills.map(skill => skill.label),
    missingRequiredSkills: missingRequiredSkills.map(skill => skill.label),
    matchedSkills: matchedSkills.map(skill => skill.label),
    missingSkills: missingSkills.map(skill => skill.label),
  };
}

module.exports = analyzeJD;
