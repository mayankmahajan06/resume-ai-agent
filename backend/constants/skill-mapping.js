const skillMapping = {
  angular: {
    label: "Angular",
    aliases: ["angular", "angular2", "angular 2+"],
  },
  angularjs: {
    label: "AngularJS",
    aliases: ["angularjs", "angular.js", "angular 1", "angular1"],
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
    aliases: ["nodejs", "node.js"],
  },

  express: {
    label: "Express.js",
    aliases: ["expressjs", "express.js"],
  },

  mongodb: {
    label: "MongoDB",
    aliases: ["mongodb"],
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
    aliases: ["scss"],
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
    aliases: ["git"],
  },

  llm: {
    label: "LLM",
    aliases: ["llm", "large language model", "large language models"],
  },

  openai: {
    label: "OpenAI",
    aliases: ["openai"],
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
    label: "Micro Frontends",
    aliases: [
      "micro frontend",
      "micro frontends",
      "microfrontend",
      "microfrontend architecture",
    ],
  },
  angularmaterial: {
    label: "Angular Material",
    aliases: ["angular material", "@angular/material"],
  },

  azuredevops: {
    label: "Azure DevOps",
    aliases: ["azure devops", "azuredevops"],
  },

  jasmine: {
    label: "Jasmine",
    aliases: ["jasmine"],
  },

  agile: {
    label: "Agile",
    aliases: ["agile"],
  },

  chatgpt: {
    label: "ChatGPT",
    aliases: ["chatgpt"],
  },

  gptmodels: {
    label: "GPT Models",
    aliases: ["gpt", "gpt-4", "gpt4", "generative pre-trained transformer"],
  },

  scrum: {
    label: "Scrum",
    aliases: ["scrum"],
  },

  kanban: {
    label: "Kanban",
    aliases: ["kanban"],
  },

  sass: {
    label: "Sass",
    aliases: ["sass"],
  },

  responsivedesign: {
    label: "Responsive Design",
    aliases: ["responsive design", "responsive ui", "responsive web design"],
  },

  accessibility: {
    label: "Accessibility",
    aliases: ["accessibility", "wcag", "a11y"],
  },

  performanceoptimization: {
    label: "Performance Optimization",
    aliases: [
      "performance optimization",
      "performance tuning",
      "web performance",
    ],
  },

  // Frontend frameworks and UI libraries
  nextjs: { label: "Next.js", aliases: ["next.js", "nextjs"] },
  nuxt: { label: "Nuxt", aliases: ["nuxt", "nuxt.js", "nuxtjs"] },
  svelte: { label: "Svelte", aliases: ["svelte", "sveltekit"] },
  jquery: { label: "jQuery", aliases: ["jquery", "jquery ui"] },
  bootstrap: { label: "Bootstrap", aliases: ["bootstrap"] },
  tailwindcss: { label: "Tailwind CSS", aliases: ["tailwind css", "tailwindcss"] },
  materialui: { label: "Material UI", aliases: ["material ui", "material-ui", "mui"] },
  chakraui: { label: "Chakra UI", aliases: ["chakra ui", "chakra-ui"] },
  antDesign: { label: "Ant Design", aliases: ["ant design", "antd"] },
  storybook: { label: "Storybook", aliases: ["storybook"] },
  webcomponents: { label: "Web Components", aliases: ["web components", "web components api"] },

  // JavaScript and backend ecosystem
  npm: { label: "npm", aliases: ["npm"] },
  yarn: { label: "Yarn", aliases: ["yarn"] },
  pnpm: { label: "pnpm", aliases: ["pnpm"] },
  vite: { label: "Vite", aliases: ["vite"] },
  webpack: { label: "Webpack", aliases: ["webpack"] },
  babel: { label: "Babel", aliases: ["babel"] },
  nestjs: { label: "NestJS", aliases: ["nestjs", "nest.js"] },
  java: { label: "Java", aliases: ["java"] },
  springboot: { label: "Spring Boot", aliases: ["spring boot", "springboot"] },
  python: { label: "Python", aliases: ["python", "python3"] },
  django: { label: "Django", aliases: ["django"] },
  flask: { label: "Flask", aliases: ["flask"] },
  php: { label: "PHP", aliases: ["php"] },
  dotnet: { label: ".NET", aliases: [".net", "dotnet", "asp.net", "asp.net core"] },
  csharp: { label: "C#", aliases: ["c#", "c sharp"] },
  golang: { label: "Go", aliases: ["golang"] },
  rust: { label: "Rust", aliases: ["rust"] },
  websocket: { label: "WebSockets", aliases: ["websocket", "websockets", "web sockets"] },

  // Data stores and API technologies
  postgresql: { label: "PostgreSQL", aliases: ["postgresql", "postgres"] },
  mysql: { label: "MySQL", aliases: ["mysql"] },
  sqlserver: { label: "Microsoft SQL Server", aliases: ["sql server", "microsoft sql server", "mssql"] },
  dynamodb: { label: "DynamoDB", aliases: ["dynamodb", "dynamo db"] },
  elasticsearch: { label: "Elasticsearch", aliases: ["elasticsearch", "elastic search"] },
  rabbitmq: { label: "RabbitMQ", aliases: ["rabbitmq", "rabbit mq"] },
  kafka: { label: "Apache Kafka", aliases: ["apache kafka", "kafka"] },
  grpc: { label: "gRPC", aliases: ["grpc"] },
  openapi: { label: "OpenAPI", aliases: ["openapi", "open api"] },
  swagger: { label: "Swagger", aliases: ["swagger"] },

  // Cloud, DevOps, and delivery
  gcp: { label: "Google Cloud Platform", aliases: ["gcp", "google cloud platform", "google cloud"] },
  azure: { label: "Microsoft Azure", aliases: ["microsoft azure", "azure"] },
  terraform: { label: "Terraform", aliases: ["terraform"] },
  ansible: { label: "Ansible", aliases: ["ansible"] },
  jenkins: { label: "Jenkins", aliases: ["jenkins"] },
  githubactions: { label: "GitHub Actions", aliases: ["github actions"] },
  gitlabci: { label: "GitLab CI/CD", aliases: ["gitlab ci", "gitlab ci/cd"] },
  nginx: { label: "Nginx", aliases: ["nginx"] },
  linux: { label: "Linux", aliases: ["linux"] },
  serverless: { label: "Serverless", aliases: ["serverless", "serverless framework"] },

  // Testing and code quality
  playwright: { label: "Playwright", aliases: ["playwright"] },
  cypress: { label: "Cypress", aliases: ["cypress"] },
  vitest: { label: "Vitest", aliases: ["vitest"] },
  testinglibrary: { label: "Testing Library", aliases: ["testing library", "@testing-library"] },
  selenium: { label: "Selenium", aliases: ["selenium"] },
  webdriverio: { label: "WebdriverIO", aliases: ["webdriverio", "webdriver io"] },
  sonarqube: { label: "SonarQube", aliases: ["sonarqube", "sonar qube"] },
  veracode: { label: "Veracode", aliases: ["veracode"] },
  eslint: { label: "ESLint", aliases: ["eslint"] },
  prettier: { label: "Prettier", aliases: ["prettier"] },

  // Architecture and engineering practices
  oauth: { label: "OAuth", aliases: ["oauth", "oauth 2.0", "oauth2"] },
  jwt: { label: "JWT", aliases: ["jwt", "json web token", "json web tokens"] },
  websocketssecurity: { label: "Web Security", aliases: ["web security", "owasp", "content security policy"] },
  accessibilitytesting: { label: "Accessibility Testing", aliases: ["accessibility testing", "axe-core"] },
  designpatterns: { label: "Design Patterns", aliases: ["design patterns", "software design patterns"] },
  cleanarchitecture: { label: "Clean Architecture", aliases: ["clean architecture"] },
  systemdesign: { label: "System Design", aliases: ["system design"] },
  mentoring: { label: "Technical Mentoring", aliases: ["mentoring", "mentor", "mentored"] },
  codereview: { label: "Code Review", aliases: ["code review", "code reviews", "peer review"] },
  unitTesting: { label: "Unit Testing", aliases: ["unit testing", "unit tests"] },
  integrationTesting: { label: "Integration Testing", aliases: ["integration testing", "integration tests"] },

  // AI engineering (kept distinct from OpenAI and ChatGPT)
  generativeai: { label: "Generative AI", aliases: ["generative ai", "gen ai"] },
  machinelearning: { label: "Machine Learning", aliases: ["machine learning", "ml"] },
  embeddings: { label: "Embeddings", aliases: ["embeddings", "embedding models"] },
  vectorDatabase: { label: "Vector Database", aliases: ["vector database", "vector databases", "vector db"] },
  huggingface: { label: "Hugging Face", aliases: ["hugging face", "huggingface"] },

  // Additional frontend and state-management skills
  redux: { label: "Redux", aliases: ["redux", "redux toolkit"] },
  zustand: { label: "Zustand", aliases: ["zustand"] },
  mobx: { label: "MobX", aliases: ["mobx"] },
  reactquery: { label: "TanStack Query", aliases: ["tanstack query", "react query"] },
  angularsignals: { label: "Angular Signals", aliases: ["angular signals", "signal-based state"] },
  rxjsoperators: { label: "RxJS Operators", aliases: ["rxjs operators"] },
  pwa: { label: "Progressive Web Apps", aliases: ["progressive web app", "progressive web apps", "pwa"] },
  ssr: { label: "Server-Side Rendering", aliases: ["server-side rendering", "server side rendering", "ssr"] },
  seo: { label: "SEO", aliases: ["seo", "search engine optimization"] },
  webaccessibility: { label: "Web Accessibility", aliases: ["web accessibility"] },

  // API design, identity, and application security
  rest: { label: "REST", aliases: ["restful services", "rest architecture"] },
  grpcweb: { label: "gRPC-Web", aliases: ["grpc-web", "grpc web"] },
  oidc: { label: "OpenID Connect", aliases: ["openid connect", "oidc"] },
  saml: { label: "SAML", aliases: ["saml", "security assertion markup language"] },
  cors: { label: "CORS", aliases: ["cors", "cross-origin resource sharing"] },
  csrf: { label: "CSRF Protection", aliases: ["csrf", "cross-site request forgery"] },
  xss: { label: "Cross-Site Scripting (XSS)", aliases: ["xss", "cross-site scripting"] },
  securecoding: { label: "Secure Coding", aliases: ["secure coding", "secure software development"] },

  // Observability and monitoring
  datadog: { label: "Datadog", aliases: ["datadog"] },
  splunk: { label: "Splunk", aliases: ["splunk"] },
  prometheus: { label: "Prometheus", aliases: ["prometheus"] },
  grafana: { label: "Grafana", aliases: ["grafana"] },
  opentelemetry: { label: "OpenTelemetry", aliases: ["opentelemetry", "open telemetry"] },

  // Delivery, collaboration, and engineering tools
  github: { label: "GitHub", aliases: ["github"] },
  gitlab: { label: "GitLab", aliases: ["gitlab"] },
  bitbucket: { label: "Bitbucket", aliases: ["bitbucket"] },
  jira: { label: "Jira", aliases: ["jira"] },
  confluence: { label: "Confluence", aliases: ["confluence"] },
  figma: { label: "Figma", aliases: ["figma"] },
  agileplanning: { label: "Agile Planning", aliases: ["agile planning", "sprint planning"] },
  technicaldocumentation: { label: "Technical Documentation", aliases: ["technical documentation", "developer documentation"] },

  // Data formats and integration
  json: { label: "JSON", aliases: ["json", "javascript object notation"] },
  xml: { label: "XML", aliases: ["xml", "extensible markup language"] },
  yaml: { label: "YAML", aliases: ["yaml", "yml"] },
  eventdriven: { label: "Event-Driven Architecture", aliases: ["event-driven architecture", "event driven architecture"] },


  // Java ecosystem and common backend requirements
  hibernate: { label: "Hibernate", aliases: ["hibernate", "hibernate orm"] },
  jpa: { label: "JPA", aliases: ["jpa", "java persistence api", "jakarta persistence"] },
  maven: { label: "Maven", aliases: ["maven", "apache maven", "mvn"] },
  junit: { label: "JUnit", aliases: ["junit", "junit 4", "junit 5"] },
  mockito: { label: "Mockito", aliases: ["mockito"] },
  springmvc: { label: "Spring MVC", aliases: ["spring mvc", "spring-mvc"] },
  springsecurity: { label: "Spring Security", aliases: ["spring security"] },
  microservices: { label: "Microservices", aliases: ["microservices", "micro services", "microservice architecture"] },
  sql: { label: "SQL", aliases: ["sql", "structured query language"] },
  gradle: { label: "Gradle", aliases: ["gradle"] },
  lombok: { label: "Lombok", aliases: ["lombok"] },
  jdbc: { label: "JDBC", aliases: ["jdbc", "java database connectivity"] },
  servlet: { label: "Java Servlets", aliases: ["java servlet", "java servlets", "servlet api"] },
  jsp: { label: "JSP", aliases: ["jsp", "java server pages"] },
  j2ee: { label: "Jakarta EE / J2EE", aliases: ["j2ee", "jakarta ee", "java ee", "jakarta enterprise edition"] },
  tomcat: { label: "Apache Tomcat", aliases: ["apache tomcat", "tomcat"] },

};

module.exports = skillMapping;
