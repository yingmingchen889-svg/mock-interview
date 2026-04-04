export const JOB_ROLES = [
  { value: "frontend", label: "\u524d\u7aef\u5de5\u7a0b\u5e08", icon: "\u{1f5a5}\ufe0f" },
  { value: "backend", label: "\u540e\u7aef\u5de5\u7a0b\u5e08", icon: "\u2699\ufe0f" },
  { value: "fullstack", label: "\u5168\u6808\u5de5\u7a0b\u5e08", icon: "\u{1f504}" },
  { value: "algorithm", label: "\u7b97\u6cd5\u5de5\u7a0b\u5e08", icon: "\u{1f9ee}" },
  { value: "data", label: "\u6570\u636e\u5de5\u7a0b\u5e08", icon: "\u{1f4ca}" },
  { value: "devops", label: "DevOps", icon: "\u{1f680}" },
  { value: "mobile", label: "\u79fb\u52a8\u7aef\u5f00\u53d1", icon: "\u{1f4f1}" },
  { value: "ai-ml", label: "AI/ML \u5de5\u7a0b\u5e08", icon: "\u{1f916}" },
] as const;

export const TECH_STACKS: Record<string, string[]> = {
  frontend: ["React", "Vue", "Angular", "TypeScript", "Next.js", "CSS/Tailwind", "Webpack/Vite", "\u6d4f\u89c8\u5668 API"],
  backend: ["Node.js", "Python", "Java", "Go", "Spring Boot", "Express", "FastAPI", "gRPC"],
  fullstack: ["React", "Node.js", "TypeScript", "Next.js", "PostgreSQL", "Redis", "Docker", "REST/GraphQL"],
  algorithm: ["\u6570\u636e\u7ed3\u6784", "\u52a8\u6001\u89c4\u5212", "\u56fe\u7b97\u6cd5", "\u6392\u5e8f/\u641c\u7d22", "\u6570\u5b66", "\u7cfb\u7edf\u8bbe\u8ba1"],
  data: ["SQL", "Spark", "Kafka", "Airflow", "Python", "ETL", "\u6570\u636e\u5efa\u6a21", "BigQuery/Snowflake"],
  devops: ["Docker", "Kubernetes", "CI/CD", "Terraform", "AWS", "Linux", "\u76d1\u63a7", "\u7f51\u7edc"],
  mobile: ["React Native", "Flutter", "Swift/iOS", "Kotlin/Android", "\u6027\u80fd\u4f18\u5316", "Native APIs"],
  "ai-ml": ["PyTorch", "TensorFlow", "NLP", "\u8ba1\u7b97\u673a\u89c6\u89c9", "MLOps", "\u7edf\u8ba1\u5b66", "\u6df1\u5ea6\u5b66\u4e60"],
};

export const DIFFICULTY_OPTIONS = [
  { value: "JUNIOR" as const, label: "\u521d\u7ea7 (0-2 \u5e74)", description: "\u57fa\u7840\u6982\u5ff5 + \u7b80\u5355\u5b9e\u73b0" },
  { value: "MID" as const, label: "\u4e2d\u7ea7 (2-5 \u5e74)", description: "\u8bbe\u8ba1\u6a21\u5f0f + \u7cfb\u7edf\u601d\u7ef4" },
  { value: "SENIOR" as const, label: "\u9ad8\u7ea7 (5+ \u5e74)", description: "\u67b6\u6784\u8bbe\u8ba1 + \u6280\u672f\u51b3\u7b56" },
];

export const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "\u5feb\u901f\u54cd\u5e94\uff0c\u6027\u4ef7\u6bd4\u9ad8", tier: "FREE" as const },
  { value: "gpt-4o", label: "GPT-4o", description: "\u6df1\u5ea6\u8ffd\u95ee\u80fd\u529b", tier: "PRO" as const },
  { value: "claude-sonnet", label: "Claude Sonnet", description: "\u7ec6\u81f4\u903b\u8f91\u5206\u6790", tier: "PRO" as const },
];
