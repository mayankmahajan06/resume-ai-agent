function validateJdAnalysisRequest(body) {
  const { resumeData, jobDescription } = body && typeof body === "object"
    ? body
    : {};

  if (typeof jobDescription !== "string" || !jobDescription.trim()) {
    return {
      valid: false,
      status: 400,
      message: "Please provide a job description to analyze.",
    };
  }

  if (jobDescription.length > 50000) {
    return {
      valid: false,
      status: 413,
      message: "The job description is too long. Please shorten it and try again.",
    };
  }

  if (!resumeData || typeof resumeData !== "object" || Array.isArray(resumeData)) {
    return {
      valid: false,
      status: 400,
      message: "Valid resume data is required for analysis.",
    };
  }

  return { valid: true };
}

module.exports = { validateJdAnalysisRequest };
