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

  // Do not treat the ".js" suffix in names like Node.js or React.js as
  // a standalone JavaScript abbreviation. Apply the same conservative rule to TS.
  if (normalizedAlias === 'js' || normalizedAlias === 'ts') {
    const shortAliasPattern = new RegExp(
      `(^|[^a-z0-9.])${normalizedAlias}(?=$|[^a-z0-9])`,
      'i'
    );
    return shortAliasPattern.test(normalizedText);
  }

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

function analyzeJD(resumeData, jobDescription) {
  const safeResume = resumeData && typeof resumeData === 'object'
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

  const matchedSkills = jdSkills.filter(skill =>
    resumeSkillKeys.has(skill.key)
  );
  const missingSkills = jdSkills.filter(skill =>
    !resumeSkillKeys.has(skill.key)
  );

  const score = jdSkills.length
    ? Math.round((matchedSkills.length / jdSkills.length) * 100)
    : 0;

  return {
    jdMatchScore: score,
    recognizedSkillsCount: jdSkills.length,
    matchedSkills: matchedSkills.map(skill => skill.label),
    missingSkills: missingSkills.map(skill => skill.label)
  };
}

module.exports = analyzeJD;
