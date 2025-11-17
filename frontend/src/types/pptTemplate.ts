export interface PPTTemplate {
  id: string;
  name: string;
  description: string;
  templatePath: string;
  thumbnailUrl: string;
  isPremium: boolean;
  slideCount: number;
}

export const pptTemplates: PPTTemplate[] = [
  {
    id: 'corporate',
    name: '기업형 (Corporate)',
    description: '심플하고 깔끔한 기업용 포트폴리오 템플릿',
    templatePath: '/corporate_portfolio_template.pptx',
    thumbnailUrl: '/ppt-thumbnails/corporate.svg',
    isPremium: true,
    slideCount: 7,
  },
  {
    id: 'colorful-clean',
    name: '컬러풀 클린 (Colorful Clean)',
    description: '현대적이고 컬러풀한 디자인의 프로페셔널 템플릿',
    templatePath: '/corporate_portfolio_template_20251116184229.pptx',
    thumbnailUrl: '/ppt-thumbnails/colorful-clean.svg',
    isPremium: true,
    slideCount: 7,
  },
  {
    id: 'impact-focused',
    name: '임팩트 중심 (Impact Focused)',
    description: 'KPI와 성과 수치를 강조하는 데이터 드리븐 템플릿',
    templatePath: '/corporate_portfolio_20251116185959.pptx',
    thumbnailUrl: '/ppt-thumbnails/impact-focused.svg',
    isPremium: true,
    slideCount: 8,
  },
  {
    id: 'pm',
    name: 'PM/PO (Product Manager)',
    description: '프로덕트 매니저를 위한 Discovery-Delivery-Launch 중심 템플릿',
    templatePath: '/pm_portfolio_template_20251116201457.pptx',
    thumbnailUrl: '/ppt-thumbnails/pm.svg',
    isPremium: true,
    slideCount: 7,
  },
];

export type PPTTemplateId = 'corporate' | 'colorful-clean' | 'impact-focused' | 'pm';
