import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { OrganizedContent } from '../services/aiOrganizer';
import { GenerationResult } from '../services/oneClickGenerator';
import { FeedbackResult } from '../services/userFeedbackService';

type TemplateType = 'minimal' | 'clean' | 'colorful' | 'elegant';

interface PortfolioState {
  userId: string;
  selectedTemplate: TemplateType | null;
  organizedContent: OrganizedContent | null;
  initialResult: GenerationResult | null;
  feedbackResult: FeedbackResult | null;
  finalResult: GenerationResult | null;
  currentStep: 'template' | 'organize' | 'autofill' | 'enhanced-edit' | 'feedback' | 'complete';
  portfolioId?: number;
  editMode?: boolean;
}

type PortfolioAction =
  | { type: 'SET_TEMPLATE'; payload: TemplateType }
  | { type: 'SET_ORGANIZED_CONTENT'; payload: OrganizedContent }
  | { type: 'SET_INITIAL_RESULT'; payload: GenerationResult }
  | { type: 'SET_FEEDBACK_RESULT'; payload: FeedbackResult }
  | { type: 'SET_FINAL_RESULT'; payload: GenerationResult }
  | { type: 'SET_CURRENT_STEP'; payload: PortfolioState['currentStep'] }
  | { type: 'SET_EDIT_MODE'; payload: { portfolioId: number; selectedTemplate: TemplateType; organizedContent: OrganizedContent } }
  | { type: 'RESET' };

const STORAGE_KEY = 'portfolio_state';

const initialState: PortfolioState = {
  userId: `user_${Date.now()}`,
  selectedTemplate: null,
  organizedContent: null,
  initialResult: null,
  feedbackResult: null,
  finalResult: null,
  currentStep: 'template'
};

const loadFromStorage = (): PortfolioState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedState = JSON.parse(stored);
      return {
        ...initialState,
        ...parsedState,
        // 항상 새로운 userId 생성
        userId: parsedState.userId || `user_${Date.now()}`
      };
    }
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
  }
  return null;
};

const saveToStorage = (state: PortfolioState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
};

const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
};

function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'SET_TEMPLATE':
      return { ...state, selectedTemplate: action.payload };
    case 'SET_ORGANIZED_CONTENT':
      return { ...state, organizedContent: action.payload };
    case 'SET_INITIAL_RESULT':
      return { ...state, initialResult: action.payload };
    case 'SET_FEEDBACK_RESULT':
      return { ...state, feedbackResult: action.payload };
    case 'SET_FINAL_RESULT':
      return { ...state, finalResult: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_EDIT_MODE':
      return {
        ...state,
        editMode: true,
        portfolioId: action.payload.portfolioId,
        selectedTemplate: action.payload.selectedTemplate,
        organizedContent: action.payload.organizedContent,
        currentStep: 'organize'
      };
    case 'RESET':
      return { ...initialState, userId: `user_${Date.now()}` };
    default:
      return state;
  }
}

interface PortfolioContextValue {
  state: PortfolioState;
  dispatch: React.Dispatch<PortfolioAction>;

  // Helper functions
  setTemplate: (template: TemplateType) => void;
  setOrganizedContent: (content: OrganizedContent) => void;
  setInitialResult: (result: GenerationResult) => void;
  setFeedbackResult: (result: FeedbackResult) => void;
  setFinalResult: (result: GenerationResult) => void;
  setCurrentStep: (step: PortfolioState['currentStep']) => void;
  setEditMode: (portfolioId: number, selectedTemplate: TemplateType, organizedContent: OrganizedContent) => void;
  reset: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  // Initialize state with localStorage data immediately
  const savedState = loadFromStorage();
  const [state, dispatch] = useReducer(portfolioReducer, savedState || initialState);

  // Mark as initialized immediately to prevent loading flicker
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage when state changes (debounced)
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      saveToStorage(state);
    }, 500); // Increased debounce time to reduce writes

    return () => clearTimeout(timeoutId);
  }, [state, isInitialized]);

  const setTemplate = useCallback((template: TemplateType) => {
    dispatch({ type: 'SET_TEMPLATE', payload: template });
  }, []);

  const setOrganizedContent = useCallback((content: OrganizedContent) => {
    dispatch({ type: 'SET_ORGANIZED_CONTENT', payload: content });
  }, []);

  const setInitialResult = useCallback((result: GenerationResult) => {
    dispatch({ type: 'SET_INITIAL_RESULT', payload: result });
  }, []);

  const setFeedbackResult = useCallback((result: FeedbackResult) => {
    dispatch({ type: 'SET_FEEDBACK_RESULT', payload: result });
  }, []);

  const setFinalResult = useCallback((result: GenerationResult) => {
    dispatch({ type: 'SET_FINAL_RESULT', payload: result });
  }, []);

  const setCurrentStep = useCallback((step: PortfolioState['currentStep']) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);

  const setEditMode = useCallback((portfolioId: number, selectedTemplate: TemplateType, organizedContent: OrganizedContent) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: { portfolioId, selectedTemplate, organizedContent } });
  }, []);

  const reset = useCallback(() => {
    clearStorage();
    dispatch({ type: 'RESET' });
  }, []);

  const value: PortfolioContextValue = {
    state,
    dispatch,
    setTemplate,
    setOrganizedContent,
    setInitialResult,
    setFeedbackResult,
    setFinalResult,
    setCurrentStep,
    setEditMode,
    reset
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}