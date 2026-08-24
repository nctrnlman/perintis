export interface RoleArchetype {
  id: string;
  title: string;
  category: string;
  commonSkills: string[];
}

export const ROLE_TAXONOMY: RoleArchetype[] = [
  // Engineering
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    category: "Engineering",
    commonSkills: ["JavaScript", "TypeScript", "React", "CSS", "Git", "REST API"],
  },
  {
    id: "backend-engineer",
    title: "Backend Engineer",
    category: "Engineering",
    commonSkills: ["Node.js", "SQL", "REST API", "Git", "Docker", "System Design"],
  },
  {
    id: "full-stack-engineer",
    title: "Full-Stack Engineer",
    category: "Engineering",
    commonSkills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git"],
  },
  {
    id: "mobile-engineer",
    title: "Mobile Engineer",
    category: "Engineering",
    commonSkills: ["Kotlin", "Swift", "Flutter", "REST API", "Git", "Mobile UI Design"],
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    category: "Engineering",
    commonSkills: ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Git"],
  },
  {
    id: "qa-engineer",
    title: "QA Engineer",
    category: "Engineering",
    commonSkills: ["Test Automation", "Manual Testing", "Selenium", "Bug Tracking", "SQL"],
  },
  // Product
  {
    id: "product-manager",
    title: "Product Manager",
    category: "Product",
    commonSkills: ["Roadmapping", "User Research", "Stakeholder Management", "Analytics", "Agile"],
  },
  {
    id: "product-owner",
    title: "Product Owner",
    category: "Product",
    commonSkills: ["Backlog Management", "Agile", "Stakeholder Management", "User Stories"],
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    category: "Product",
    commonSkills: ["Requirements Gathering", "SQL", "Data Analysis", "Process Mapping", "Stakeholder Management"],
  },
  // Design
  {
    id: "ui-ux-designer",
    title: "UI/UX Designer",
    category: "Design",
    commonSkills: ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems"],
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer",
    category: "Design",
    commonSkills: ["Adobe Illustrator", "Adobe Photoshop", "Typography", "Branding", "Layout Design"],
  },
  {
    id: "product-designer",
    title: "Product Designer",
    category: "Design",
    commonSkills: ["Figma", "User Research", "Prototyping", "Interaction Design", "Design Systems"],
  },
  // Data
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "Data",
    commonSkills: ["SQL", "Excel", "Data Visualization", "Statistics", "Python"],
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    category: "Data",
    commonSkills: ["Python", "Machine Learning", "Statistics", "SQL", "Data Visualization"],
  },
  {
    id: "data-engineer",
    title: "Data Engineer",
    category: "Data",
    commonSkills: ["SQL", "Python", "ETL", "Data Warehousing", "Cloud Platforms"],
  },
  // Marketing
  {
    id: "digital-marketing-specialist",
    title: "Digital Marketing Specialist",
    category: "Marketing",
    commonSkills: ["SEO", "Google Ads", "Content Marketing", "Social Media", "Analytics"],
  },
  {
    id: "content-marketing-specialist",
    title: "Content Marketing Specialist",
    category: "Marketing",
    commonSkills: ["Copywriting", "SEO", "Content Strategy", "Social Media", "Editing"],
  },
  {
    id: "social-media-manager",
    title: "Social Media Manager",
    category: "Marketing",
    commonSkills: ["Content Creation", "Social Media", "Community Management", "Analytics", "Copywriting"],
  },
  {
    id: "seo-specialist",
    title: "SEO Specialist",
    category: "Marketing",
    commonSkills: ["SEO", "Keyword Research", "Google Analytics", "Content Strategy", "Link Building"],
  },
  // Business & Finance
  {
    id: "financial-analyst",
    title: "Financial Analyst",
    category: "Business & Finance",
    commonSkills: ["Financial Modeling", "Excel", "Forecasting", "Data Analysis", "Accounting"],
  },
  {
    id: "accountant",
    title: "Accountant",
    category: "Business & Finance",
    commonSkills: ["Accounting", "Bookkeeping", "Tax Compliance", "Excel", "Financial Reporting"],
  },
  {
    id: "business-development",
    title: "Business Development",
    category: "Business & Finance",
    commonSkills: ["Sales", "Negotiation", "Relationship Management", "Market Research", "Presentation"],
  },
  // Operations
  {
    id: "operations-manager",
    title: "Operations Manager",
    category: "Operations",
    commonSkills: ["Process Improvement", "Project Management", "Team Leadership", "Vendor Management", "Budgeting"],
  },
  {
    id: "project-manager",
    title: "Project Manager",
    category: "Operations",
    commonSkills: ["Project Planning", "Agile", "Stakeholder Management", "Risk Management", "Budgeting"],
  },
  {
    id: "supply-chain-analyst",
    title: "Supply Chain Analyst",
    category: "Operations",
    commonSkills: ["Logistics", "Inventory Management", "Data Analysis", "Excel", "Forecasting"],
  },
  // HR
  {
    id: "hr-generalist",
    title: "HR Generalist",
    category: "HR",
    commonSkills: ["Recruitment", "Employee Relations", "Onboarding", "HR Policies", "Payroll"],
  },
  {
    id: "talent-acquisition-specialist",
    title: "Talent Acquisition Specialist",
    category: "HR",
    commonSkills: ["Recruitment", "Sourcing", "Interviewing", "Employer Branding", "Applicant Tracking Systems"],
  },
  {
    id: "l-and-d-specialist",
    title: "L&D Specialist",
    category: "HR",
    commonSkills: ["Training Design", "Facilitation", "Needs Assessment", "Onboarding", "Employee Development"],
  },
];
