const skillMapping =
  require('../constants/skill-mapping');

/*
========================================
NORMALIZE TEXT
========================================
*/

function normalizeText(text = '') {

  return text
    .toLowerCase()
    .replace(/[^\w\s/#.+-]/g, ' ');

}

/*
========================================
EXTRACT SKILLS
========================================
*/

function extractSkills(text = '') {

  const normalizedText =
    normalizeText(text);

  const detectedSkills = [];

  Object.entries(skillMapping)
    .forEach(([key, skillData]) => {

      const matched =
        skillData.aliases.some(alias =>
          normalizedText.includes(
            alias.toLowerCase()
          )
        );

      if (matched) {

        detectedSkills.push({
          key,
          label: skillData.label
        });

      }

    });

  return detectedSkills;

}

/*
========================================
REMOVE DUPLICATES
========================================
*/

function uniqueSkills(skills = []) {

  const map = new Map();

  skills.forEach(skill => {

    map.set(skill.key, skill);

  });

  return Array.from(map.values());

}

/*
========================================
ANALYZE JD
========================================
*/

function analyzeJD(
  resumeData,
  jobDescription
) {

  const resumeText = `

    ${resumeData.skills || ''}

    ${resumeData.summary || ''}

    ${resumeData.experiences
      ?.map(exp =>
        `
        ${exp.role || ''}
        ${exp.company || ''}
        ${exp.responsibilities || ''}
        `
      )
      .join(' ') || ''}

    ${resumeData.projects
      ?.map(project =>
        `
        ${project.projectName || ''}
        ${project.techStack || ''}
        ${project.description || ''}
        `
      )
      .join(' ') || ''}

  `;

  /*
  ========================================
  EXTRACT SKILLS
  ========================================
  */

  const jdSkills =
    uniqueSkills(
      extractSkills(jobDescription)
    );

  const resumeSkills =
    uniqueSkills(
      extractSkills(resumeText)
    );

  /*
  ========================================
  MATCHING
  ========================================
  */

  const matchedSkills =
    jdSkills.filter(jdSkill =>

      resumeSkills.some(
        resumeSkill =>
          resumeSkill.key === jdSkill.key
      )

    );

  const missingSkills =
    jdSkills.filter(jdSkill =>

      !resumeSkills.some(
        resumeSkill =>
          resumeSkill.key === jdSkill.key
      )

    );

  /*
  ========================================
  SCORE
  ========================================
  */

  let score = 0;

  if (jdSkills.length > 0) {

    score = Math.round(
      (
        matchedSkills.length /
        jdSkills.length
      ) * 100
    );

  }


  /*
  ========================================
  RESPONSE
  ========================================
  */

  return {

    jdMatchScore: score,

    matchedSkills:
      matchedSkills.map(
        skill => skill.label
      ),

    missingSkills:
      missingSkills.map(
        skill => skill.label
      )

  };

}

module.exports = analyzeJD;