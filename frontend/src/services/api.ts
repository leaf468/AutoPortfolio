import axios from 'axios';
import { 
  PortfolioRequest, 
  AssistantResponse, 
  GenerateResponse,
  PortfolioData 
} from '../types/portfolio';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const portfolioAPI = {
  analyze: async (data: Partial<PortfolioData>): Promise<AssistantResponse> => {
    const response = await api.post('/api/analyze', data);
    return response.data;
  },

  generate: async (request: PortfolioRequest): Promise<GenerateResponse> => {
    const response = await api.post('/api/generate', request);
    return response.data;
  },

  // 새로운 AI 기반 API들
  parseText: async (data: { template: string; rawText: string }) => {
    const response = await api.post('/api/parse-text', data);
    return response.data;
  },

  generateQuestions: async (data: { missing_fields: string[]; context: any }) => {
    const response = await api.post('/api/generate-questions', data);
    return response.data;
  },

  processAnswer: async (data: { question: any; answer: string; current_data: any }) => {
    const response = await api.post('/api/process-answer', data);
    return response.data;
  },

  generateFromTemplate: async (data: { template: string; data: any }): Promise<GenerateResponse> => {
    const response = await api.post('/api/generate-from-template', data);
    return response.data;
  },

  download: (portfolioId: string) => {
    return `${API_BASE_URL}/api/download/${portfolioId}`;
  },

  preview: (portfolioId: string) => {
    return `${API_BASE_URL}/api/preview/${portfolioId}`;
  },

  getTemplates: async () => {
    const response = await api.get('/api/templates');
    return response.data.templates;
  },

  chat: async (message: string, context?: any): Promise<AssistantResponse> => {
    const response = await api.post('/api/chat', { message, context });
    return response.data;
  },
};

export default api;