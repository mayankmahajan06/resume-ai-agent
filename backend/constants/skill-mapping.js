const skillMapping = {
  angular: {
    label: "Angular",
    aliases: ["angular", "angular2", "angular 2+"],
  },

  react: {
    label: "React",
    aliases: ["react", "reactjs", "react.js"],
  },

  vue: {
    label: "Vue",
    aliases: ["vue", "vuejs"],
  },

  typescript: {
    label: "TypeScript",
    aliases: ["typescript", "ts"],
  },

  javascript: {
    label: "JavaScript",
    aliases: ["javascript", "js", "ecmascript"],
  },

  rxjs: {
    label: "RxJS",
    aliases: ["rxjs"],
  },

  ngrx: {
    label: "NgRx",
    aliases: ["ngrx"],
  },

  nodejs: {
    label: "Node.js",
    aliases: ["nodejs", "node.js", "node"],
  },

  express: {
    label: "Express.js",
    aliases: ["express", "expressjs"],
  },

  mongodb: {
    label: "MongoDB",
    aliases: ["mongodb", "mongo"],
  },

  firebase: {
    label: "Firebase",
    aliases: ["firebase"],
  },

  aws: {
    label: "AWS",
    aliases: ["aws", "amazon web services"],
  },

  docker: {
    label: "Docker",
    aliases: ["docker"],
  },

  kubernetes: {
    label: "Kubernetes",
    aliases: ["kubernetes", "k8s"],
  },

  cicd: {
    label: "CI/CD",
    aliases: [
      "ci/cd",
      "cicd",
      "continuous integration",
      "continuous deployment",
    ],
  },

  html: {
    label: "HTML",
    aliases: ["html", "html5"],
  },

  css: {
    label: "CSS",
    aliases: ["css", "css3"],
  },

  scss: {
    label: "SCSS",
    aliases: ["scss", "sass"],
  },

  restapi: {
    label: "REST APIs",
    aliases: ["rest api", "rest apis", "restful api"],
  },

  graphql: {
    label: "GraphQL",
    aliases: ["graphql"],
  },

  git: {
    label: "Git",
    aliases: ["git", "github", "gitlab"],
  },

  llm: {
    label: "LLM",
    aliases: ["llm", "large language model", "large language models"],
  },

  openai: {
    label: "OpenAI",
    aliases: ["openai", "chatgpt", "gpt", "gpt4"],
  },

  promptengineering: {
    label: "Prompt Engineering",
    aliases: ["prompt engineering", "prompt engineer"],
  },

  rag: {
    label: "RAG",
    aliases: ["rag", "retrieval augmented generation"],
  },
  langchain: {
    label: "LangChain",
    aliases: ["langchain"],
  },

  redis: {
    label: "Redis",
    aliases: ["redis"],
  },

  jest: {
    label: "Jest",
    aliases: ["jest"],
  },

  karma: {
    label: "Karma",
    aliases: ["karma"],
  },

  microfrontend: {
    label: "Microfrontend",
    aliases: ["microfrontend", "micro frontends", "microfrontend architecture"],
  },
};

module.exports = skillMapping;
