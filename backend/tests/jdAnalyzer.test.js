const assert = require('node:assert/strict');
const analyzeJD = require('../services/jdAnalyzer');

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
