const assert = require('node:assert/strict');
const analyzeJD = require('../services/jdAnalyzer');
const skillMapping = require('../constants/skill-mapping');

function analyze(resumeText, jobDescription) {
  return analyzeJD(
    {
      skills: resumeText,
      summary: '',
      experiences: [],
      projects: []
    },
    jobDescription
  );
}

// AngularJS must not be counted as modern Angular.
{
  const result = analyze('AngularJS, JavaScript', 'Angular and AngularJS');
  assert.deepEqual(result.matchedSkills, ['AngularJS']);
  assert.deepEqual(result.missingSkills, ['Angular']);
  assert.equal(result.jdMatchScore, 50);
}

// Short aliases must match whole terms, not substrings inside words.
{
  const result = analyze('projects and design', 'JavaScript, TypeScript, Git');
  assert.deepEqual(result.matchedSkills, []);
  assert.deepEqual(result.missingSkills, ['JavaScript', 'TypeScript', 'Git']);
  assert.equal(result.jdMatchScore, 0);
}

// Recognize legitimate aliases and punctuation-bearing technology names.
{
  const result = analyze(
    'Node.js, CI/CD, HTML5, CSS3, GitHub',
    'Node.js, CI/CD, HTML, CSS, Git'
  );
  assert.deepEqual(result.matchedSkills, [
    'Node.js',
    'CI/CD',
    'HTML',
    'CSS'
  ]);
  assert.deepEqual(result.missingSkills, ['Git']);
  assert.equal(result.jdMatchScore, 80);
}

// Related platforms and AI products must not imply a different skill.
{
  const result = analyze(
    'GitHub, GitLab, ChatGPT, GPT-4',
    'Git, OpenAI, ChatGPT'
  );
  assert.deepEqual(result.matchedSkills, ['ChatGPT']);
  assert.deepEqual(result.missingSkills, ['Git', 'OpenAI']);
  assert.equal(result.jdMatchScore, 33);
}

// Methodology names are distinct from the broader Agile label.
{
  const result = analyze('Scrum and Kanban', 'Agile, Scrum, Kanban');
  assert.deepEqual(result.matchedSkills, ['Scrum', 'Kanban']);
  assert.deepEqual(result.missingSkills, ['Agile']);
  assert.equal(result.jdMatchScore, 67);
}

// A standalone "node" mention is not enough to prove Node.js.
{
  const result = analyze('Node-based workflow', 'Node.js');
  assert.deepEqual(result.matchedSkills, []);
  assert.deepEqual(result.missingSkills, ['Node.js']);
  assert.equal(result.jdMatchScore, 0);
}

// Angular spellings and version labels must not cross-match AngularJS.
{
  const cases = [
    ['AngularJS', 'Angular', false],
    ['Angular 1', 'Angular', false],
    ['Angular.js', 'Angular', false],
    ['Angular 2+', 'Angular', true],
    ['Angular 2+', 'AngularJS', false]
  ];

  for (const [resumeText, jdText, shouldMatch] of cases) {
    const result = analyze(resumeText, jdText);
    assert.equal(
      result.matchedSkills.includes('Angular'),
      shouldMatch,
      `Unexpected Angular match for resume "${resumeText}" and JD "${jdText}"`
    );
  }
}

// Abbreviations are recognized only as complete terms.
{
  assert.deepEqual(analyze('TS', 'TypeScript').matchedSkills, ['TypeScript']);
  assert.deepEqual(analyze('JS', 'JavaScript').matchedSkills, ['JavaScript']);
  assert.deepEqual(analyze('status and projects', 'TypeScript, JavaScript').matchedSkills, []);
}

// React/Vue aliases remain supported.
{
  const result = analyze('ReactJS, VueJS, ECMAScript', 'React, Vue, JavaScript');
  assert.deepEqual(result.matchedSkills, ['React', 'Vue', 'JavaScript']);
  assert.deepEqual(result.missingSkills, []);
  assert.equal(result.jdMatchScore, 100);
}

// Angular Material and Material UI are different component libraries.
{
  const result = analyze(
    'Material UI, MUI',
    'Angular Material, Material UI'
  );
  assert.deepEqual(result.matchedSkills, ['Material UI']);
  assert.deepEqual(result.missingSkills, ['Angular Material']);
  assert.equal(result.jdMatchScore, 50);
}

// Every configured alias should recognize its own canonical skill label.
{
  for (const [key, skill] of Object.entries(skillMapping)) {
    assert.ok(skill.label, `Skill "${key}" must have a label`);
    assert.ok(Array.isArray(skill.aliases) && skill.aliases.length > 0,
      `Skill "${key}" must define aliases`);

    for (const alias of skill.aliases) {
      const result = analyze(alias, skill.label);
      assert.ok(
        result.matchedSkills.includes(skill.label),
        `Alias "${alias}" did not match canonical skill "${skill.label}"`
      );
    }
  }
}

// Common technology names must not be detected inside longer unrelated words.
{
  const result = analyze(
    'JavaScript, TypeScript, express delivery, mongo-themed project',
    'Java, TypeScript, Express.js, MongoDB'
  );
  assert.deepEqual(result.matchedSkills, ['TypeScript']);
  assert.deepEqual(result.missingSkills, ['Java', 'Express.js', 'MongoDB']);
  assert.equal(result.jdMatchScore, 25);
}

// Education and certifications can provide evidence when the data is structured.
{
  const result = analyzeJD({
    skills: '',
    summary: '',
    experiences: [],
    projects: [],
    education: [{ degree: 'BSc Computer Science', college: 'University' }],
    certifications: [{ certificationName: 'AWS Certified Developer' }]
  }, 'AWS');
  assert.deepEqual(result.matchedSkills, ['AWS']);
  assert.equal(result.jdMatchScore, 100);
}

// Empty or malformed resume objects should not crash analysis.
{
  assert.equal(analyzeJD(null, 'Angular').jdMatchScore, 0);
  assert.equal(analyzeJD({}, 'Angular').jdMatchScore, 0);
}

// Duplicate mentions count once; unknown job descriptions produce zero.
{
  const result = analyze('Angular, Angular, TypeScript', 'Angular Angular TypeScript');
  assert.deepEqual(result.matchedSkills, ['Angular', 'TypeScript']);
  assert.equal(result.jdMatchScore, 100);
  assert.equal(analyze('Angular', 'People-focused leadership').jdMatchScore, 0);
}

console.log('JD analyzer tests passed.');
