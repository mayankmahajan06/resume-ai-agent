const MODEL_NAME = "gemini-3.8-flash";

let clientPromise;

async function getClient() {
  if (!clientPromise) {
    clientPromise = import("@google/genai").then(({ GoogleGenAI }) => {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      return new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
    });
  }

  return clientPromise;
}

function buildCoverLetterPrompt({
  resumeText,
  jobTitle,
  companyName,
  jobDescription,
  tone,
}) {
  return `
Create a tailored professional cover letter using ONLY the information supported by the resume.

RESUME:
<<<
${resumeText}
>>>

JOB TITLE:
${jobTitle}

COMPANY:
${companyName}

JOB DESCRIPTION:
<<<
${jobDescription}
>>>

TONE:
${tone}

Rules:
- Never invent employers, job titles, years of experience, skills, achievements, metrics, certifications, education, projects, or other facts.
- Use the resume as the source of truth for candidate facts.
- Tailor the letter to the job description and emphasize relevant experience and skills that actually appear in the resume.
- Do not copy sentences from the job description.
- Do not mention that AI was used.
- Do not use placeholders such as [Name], [Company], or [Skill].
- Keep the letter concise and recruiter-friendly, normally around 300-450 words.
- Start with an appropriate greeting such as "Dear Hiring Manager," unless a suitable named contact is explicitly provided.
- Return only the cover letter text. Do not add commentary, explanations, markdown fences, or a title.
`;
}

async function generateCoverLetter(input) {
  const ai = await getClient();

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: buildCoverLetterPrompt(input),
    config: {
      temperature: 0.7,
      maxOutputTokens: 900,
    },
  });

  const content = response.text?.trim();

  if (!content) {
    throw new Error("Gemini returned an empty cover letter");
  }

  return content;
}

module.exports = {
  generateCoverLetter,
};
