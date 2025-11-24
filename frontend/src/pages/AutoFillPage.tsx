import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AutoFillPortfolioEditor from '../components/AutoFillPortfolioEditor';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PortfolioDocument } from '../services/autoFillService';
import { GenerationResult } from '../services/oneClickGenerator';
import { aiOrganizer } from '../services/aiOrganizer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { trackButtonClick } from '../utils/analytics';

export default function AutoFillPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, setInitialResult, setCurrentStep, setOrganizedContent } = usePortfolio();
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [userName, setUserName] = useState<string>('');

  // 사용자 이름 가져오기
  useEffect(() => {
    const loadUserName = async () => {
      if (!user) return;

      try {

        // users 테이블에서 name 가져오기
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('user_id', user.user_id)
          .single();

        if (userError) {
        } else {
        }

        // 이름 우선순위: DB users 테이블 > AuthContext user 객체 > 기본값
        const name = userData?.name || user.name || '';
        setUserName(name);
      } catch (error) {
        setUserName(user.name || '');
      }
    };

    loadUserName();
  }, [user]);

  useEffect(() => {
    setCurrentStep('autofill');

    // originalInput이 있으면 (OrganizeContentPage에서 바로 전달받은 경우) AI 처리 시작
    if (state.organizedContent?.originalInput && !state.organizedContent.summary) {
      processAIOrganization();
      return;
    }

    // 필수 데이터가 없으면 이전 단계로 이동
    if (!state.selectedTemplate || !state.organizedContent) {
      if (!state.selectedTemplate) {
        navigate('/template');
      } else if (!state.organizedContent) {
        navigate('/organize');
      }
      return;
    }
  }, []);

  const processAIOrganization = async () => {
    if (!state.organizedContent?.originalInput) return;

    setIsProcessingAI(true);
    try {
      const { rawText, inputType, jobPosting } = state.organizedContent.originalInput;

      let organized = await aiOrganizer.organizeContent(rawText, inputType);

      // 채용공고가 있으면 추가 최적화
      if (jobPosting) {
        organized = await aiOrganizer.enhanceWithJobPosting(organized, jobPosting);
      }

      // 원본 입력 데이터를 결과에 추가
      organized.originalInput = state.organizedContent.originalInput;


      // 처리된 데이터 저장
      setOrganizedContent(organized);
      setIsProcessingAI(false);
    } catch (error) {
      setIsProcessingAI(false);
      // 오류 발생 시 이전 페이지로 돌아가기
      navigate('/organize');
    }
  };

  const handleAutoFillSave = (document: PortfolioDocument) => {
    trackButtonClick('AutoFill 저장', 'AutoFillPage');
    // Convert document to GenerationResult format for compatibility
    const result: GenerationResult = {
      id: document.doc_id,
      content: JSON.stringify(document),
      format: 'json',
      metadata: {
        wordCount: document.sections.reduce((acc, s) =>
          acc + s.blocks.reduce((blockAcc, b) => blockAcc + b.text.split(' ').length, 0), 0
        ),
        estimatedReadTime: Math.ceil(
          document.sections.reduce((acc, s) =>
            acc + s.blocks.reduce((blockAcc, b) => blockAcc + b.text.split(' ').length, 0), 0
          ) / 200
        ),
        generatedAt: new Date(),
        template: state.selectedTemplate || 'minimal'
      },
      qualityScore: 85,
      suggestions: []
    };
    setInitialResult(result);
    setCurrentStep('enhanced-edit');
    navigate('/edit');
  };

  const handleEnhancedEdit = (doc: PortfolioDocument) => {
    trackButtonClick('고급 편집으로 이동', 'AutoFillPage');
    // Convert to GenerationResult and go to enhanced edit
    const result: GenerationResult = {
      id: doc.doc_id,
      content: JSON.stringify(doc),
      format: 'json',
      metadata: {
        wordCount: doc.sections.reduce((acc, s) =>
          acc + s.blocks.reduce((blockAcc, b) => blockAcc + b.text.split(' ').length, 0), 0
        ),
        estimatedReadTime: Math.ceil(
          doc.sections.reduce((acc, s) =>
            acc + s.blocks.reduce((blockAcc, b) => blockAcc + b.text.split(' ').length, 0), 0
          ) / 200
        ),
        generatedAt: new Date(),
        template: state.selectedTemplate || 'minimal'
      },
      qualityScore: 85,
      suggestions: []
    };
    setInitialResult(result);
    setCurrentStep('enhanced-edit');
    navigate('/edit');
  };

  // AI 처리 중이어도 로딩 화면 표시하지 않고 바로 에디터 화면으로 진행
  // 백그라운드에서 AI 처리는 계속 진행됨

  if (!state.selectedTemplate || !state.organizedContent) {
    return null; // 리다이렉션 중이므로 아무것도 렌더링하지 않음
  }

  // 디버깅: AutoFill 단계로 전달되는 데이터 확인

  return (
    <MainLayout>
      <div className="max-w-full">
        <AutoFillPortfolioEditor
          userId={state.userId}
          selectedTemplate={state.selectedTemplate}
          initialInputs={{
            // 원본 사용자 입력 추가
            content: state.organizedContent?.originalInput?.rawText || '',
            profile: JSON.stringify({
              name: userName, // 마이페이지에서 가져온 사용자 이름
              organizedContent: state.organizedContent, // AI로 가공된 결과
              originalInput: state.organizedContent?.originalInput || null // 전체 originalInput 객체 전달
            }),
            projects: (state.organizedContent.projects || []).map(p => ({
              title: p.name,
              description: p.summary,
              role: p.myRole,
              duration: ''
            })),
            skills: (state.organizedContent.skills || []).flatMap(s => s.skills || []),
            education: '',
            experience: (state.organizedContent.experiences || []).map(e =>
              `${e.position} at ${e.company} (${e.duration})`
            ).join('\n'),
            // 채용공고가 있으면 추가
            target_job: state.organizedContent?.originalInput?.jobPosting || ''
          }}
          targetJobKeywords={[
            ...state.organizedContent.keywords.technical,
            ...state.organizedContent.keywords.industry
          ]}
          onSave={handleAutoFillSave}
          onEnhancedEdit={handleEnhancedEdit}
        />
      </div>
    </MainLayout>
  );
}