export interface UserInfo {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary: string;
  location?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface Project {
  name: string;
  description: string;
  url?: string;
  githubUrl?: string;
  technologies: string[];
  highlights: string[];
  imageUrl?: string;
  date?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  achievements: string[];
}

export interface Skill {
  category: string;
  items: string[];
  proficiency?: number;
}

export interface PortfolioData {
  userInfo: UserInfo;
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  skills: Skill[];
  certifications: string[];
  languages: { language: string; proficiency: string }[];
}

export interface PortfolioRequest extends PortfolioData {
  format: 'markdown' | 'html' | 'pdf';
  template: string;
  theme?: string;
}

export interface AssistantResponse {
  action: string;
  message: string;
  payload?: any;
  missingFields: string[];
  stop: boolean;
}

export interface GenerateResponse {
  portfolioId: string;
  format: string;
  content?: string;
  previewUrl?: string;
  downloadUrl: string;
  message: string;
}