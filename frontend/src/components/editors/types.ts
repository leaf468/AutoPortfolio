import { PortfolioDocument } from '../../services/autoFillService';

export interface BaseEditorProps {
  document: PortfolioDocument;
  selectedTemplate: 'minimal' | 'clean' | 'colorful' | 'elegant';
  onSave: (updatedDocument: PortfolioDocument) => void;
  onBack: () => void;
  onSkipToNaturalEdit?: () => void;
  onTemplateChange?: (template: 'minimal' | 'clean' | 'colorful' | 'elegant') => void;
}

export interface SkillCategory {
  category: string;
  skills: string[];
  icon?: string;
}

export interface PortfolioData {
  name: string;
  title: string;
  email: string;
  phone: string;
  github?: string;
  location?: string;
  about: string;
  skills: string[];
  skillCategories?: SkillCategory[];
  projects: ProjectData[];
  experience: ExperienceData[];
  education?: EducationData[];
  awards?: AwardData[];
}

// 템플릿별 특화 데이터 타입
export interface MinimalPortfolioData extends PortfolioData {
  education: EducationData[];
}

export interface CleanPortfolioData extends Omit<PortfolioData, 'education'> {
  location: string;
  awards: AwardData[];
  skillCategories?: SkillCategory[];
}

export interface ColorfulPortfolioData extends Omit<PortfolioData, 'education' | 'location' | 'awards'> {
  skillCategories?: SkillCategory[];
}

export interface ElegantPortfolioData extends Omit<PortfolioData, 'education' | 'location' | 'awards'> {
  skillCategories?: SkillCategory[];
}

export interface ProjectData {
  name: string;
  description: string;
  period?: string;
  role?: string;
  company?: string;
  tech?: string[];
  url?: string;
  github?: string;
  demo?: string;
  results?: string[];
}

export interface ExperienceData {
  position: string;
  company: string;
  duration: string;
  description: string;
  achievements?: string[];
}

export interface EducationData {
  school: string;
  degree: string;
  period: string;
  description?: string;
}

export interface AwardData {
  title: string;
  organization: string;
  year: string;
  description?: string;
}