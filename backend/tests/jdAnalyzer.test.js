const assert = require('node:assert/strict');
const analyzeJD = require('../services/jdAnalyzer');
const skillMapping = require('../constants/skill-mapping');
const { validateJdAnalysisRequest } = require('../services/jdRequestValidation');

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
  assert.deepEqual(result.missingSkills, ['TypeScript', 'JavaScript', 'Git']);
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
    ['Angular 11', 'Angular', true],
    ['Angular 1.8', 'Angular', false],
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

// ".js" suffixes in library names must not count as the standalone JS alias.
{
  const result = analyze('Node.js, React.js, TypeScript', 'JavaScript, TypeScript');
  assert.deepEqual(result.matchedSkills, ['TypeScript']);
  assert.deepEqual(result.missingSkills, ['JavaScript']);
  assert.equal(result.jdMatchScore, 50);
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

// The top-level mapping must not silently overwrite duplicate JavaScript object keys.
{
  const fs = require('node:fs');
  const path = require('node:path');
  const mappingSource = fs.readFileSync(
    path.join(__dirname, '../constants/skill-mapping.js'),
    'utf8'
  );
  const keys = Array.from(
    mappingSource.matchAll(/^  ([A-Za-z_$][\w$]*):\s*\{/gm),
    match => match[1]
  );
  assert.equal(
    new Set(keys).size,
    keys.length,
    'Skill mapping contains duplicate top-level keys'
  );
}

// Every configured alias should recognize its own canonical skill label.
{
  for (const [key, skill] of Object.entries(skillMapping)) {
    assert.ok(skill.label, `Skill "${key}" must have a label`);
    assert.ok(Array.isArray(skill.aliases) && skill.aliases.length > 0,
      `Skill "${key}" must define aliases`);

    for (const alias of skill.aliases) {
      const result = analyze(alias, alias);
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
  assert.deepEqual(result.missingSkills, ['Express.js', 'MongoDB', 'Java']);
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

// Request validation returns predictable client errors before analysis.
{
  assert.deepEqual(validateJdAnalysisRequest({}), {
    valid: false,
    status: 400,
    message: 'Please provide a job description to analyze.'
  });
  assert.equal(
    validateJdAnalysisRequest({
      resumeData: {},
      jobDescription: '   '
    }).status,
    400
  );
  assert.equal(
    validateJdAnalysisRequest({
      resumeData: {},
      jobDescription: 'x'.repeat(50001)
    }).status,
    413
  );
  assert.equal(
    validateJdAnalysisRequest({
      resumeData: [],
      jobDescription: 'Angular'
    }).status,
    400
  );
  assert.equal(
    validateJdAnalysisRequest({
      resumeData: {},
      jobDescription: 'Angular'
    }).valid,
    true
  );
}

// Explicitly required skills receive double weight; other skills count once.
{
  const result = analyze(
    'Angular',
    'Required: Angular and TypeScript. Nice to have: React.'
  );
  assert.equal(result.jdMatchScore, 33);
  assert.deepEqual(result.requiredSkills, ['Angular', 'TypeScript']);
  assert.deepEqual(result.missingRequiredSkills, ['TypeScript']);
  assert.match(result.scoreMethod, /Recognized-skill overlap/);
}

// Periods inside technology names must not break required-skill detection.
{
  const result = analyze('Node.js', 'Node.js is required. React is nice to have.');
  assert.deepEqual(result.requiredSkills, ['Node.js']);
  assert.equal(result.jdMatchScore, 50);
}

// Without explicit requirement wording, scoring remains equal-weight.
{
  const result = analyze('Angular', 'Angular, TypeScript, React');
  assert.equal(result.jdMatchScore, 33);
  assert.deepEqual(result.requiredSkills, []);
  assert.deepEqual(result.missingRequiredSkills, []);
  assert.match(result.scoreMethod, /Recognized-skill overlap/);
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



// Java backend technologies must be recognized and reported missing when absent.
{
  const result = analyze(
    'Angular, TypeScript, REST APIs, Git',
    'Required: Java, Spring Boot, Hibernate, JPA, Maven, JUnit, Mockito, SQL, PostgreSQL and Apache Kafka.'
  );
  for (const skill of ['Java', 'Spring Boot', 'Hibernate', 'JPA', 'Maven', 'JUnit', 'Mockito', 'SQL', 'PostgreSQL', 'Apache Kafka']) {
    assert.ok(result.missingSkills.includes(skill), `Expected ${skill} to be mapped and reported missing`);
  }
  assert.equal(result.requiredSkillMatchScore, 0);
}

// Explicit must-have coverage is exposed separately from overall overlap.
{
  const result = analyze(
    'Angular, JavaScript, HTML, CSS, REST APIs, Unit Testing',
    'AngularJS is required. JavaScript, HTML, CSS, REST APIs and Unit Testing are required.'
  );
  assert.ok(result.requiredSkills.includes('AngularJS'));
  assert.ok(result.missingRequiredSkills.includes('AngularJS'));
  assert.ok(result.requiredSkillMatchScore < 100);
}

// Unrecognized technical tokens are surfaced separately for review.
{
  const result = analyze('Angular, TypeScript', 'Required: Angular, TypeScript, FooQZ and Hibernate.');
  assert.ok(Array.isArray(result.unrecognizedJdTerms));
}


// Skills listed under a dedicated Required Skills section count as required.
{
  const result = analyze('Angular, JavaScript', 'Required Skills:\n- AngularJS 1.x\n- JavaScript\nPreferred Skills:\n- React');
  assert.deepEqual(result.requiredSkills, ['AngularJS', 'JavaScript']);
  assert.deepEqual(result.missingRequiredSkills, ['AngularJS']);
  assert.equal(result.requiredSkillMatchScore, 50);
}

// Generic Requirements headings do not automatically elevate every listed skill.
{
  const result = analyze('Angular', 'Requirements:\n- Angular\n- React');
  assert.deepEqual(result.requiredSkills, []);
}

console.log('JD analyzer tests passed.');
