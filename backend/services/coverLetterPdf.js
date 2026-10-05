function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildCoverLetterPdfHTML(content, template = 'classic') {
  const safeContent = escapeHtml(content)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n/g, '<br>');

  const styles = {
    classic: {
      page: '#ffffff',
      text: '#1f2937',
      accent: '#334155',
      font: 'Georgia, "Times New Roman", serif',
      size: '11.5pt',
      line: '1.75',
      padding: '56px'
    },
    modern: {
      page: '#ffffff',
      text: '#1e293b',
      accent: '#4f46e5',
      font: 'Arial, Helvetica, sans-serif',
      size: '11pt',
      line: '1.7',
      padding: '54px'
    },
    minimal: {
      page: '#ffffff',
      text: '#334155',
      accent: '#64748b',
      font: 'Arial, Helvetica, sans-serif',
      size: '10.8pt',
      line: '1.65',
      padding: '62px'
    }
  };

  const selected = styles[template] || styles.classic;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: ${selected.page};
    color: ${selected.text};
    font-family: ${selected.font};
    font-size: ${selected.size};
    line-height: ${selected.line};
  }
  .page {
    min-height: 297mm;
    padding: ${selected.padding};
  }
  .accent {
    height: 4px;
    width: 64px;
    background: ${selected.accent};
    margin-bottom: 30px;
  }
  .letter {
    white-space: normal;
    overflow-wrap: anywhere;
  }
</style>
</head>
<body>
  <main class="page">
    <div class="accent"></div>
    <div class="letter">${safeContent}</div>
  </main>
</body>
</html>`;
}

module.exports = {
  buildCoverLetterPdfHTML,
};
