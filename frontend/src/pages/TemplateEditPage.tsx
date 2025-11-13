import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PortfolioDocument } from '../services/autoFillService';
import { GenerationResult } from '../services/oneClickGenerator';
import MinimalEditor from '../components/editors/MinimalEditor';
import CleanEditor from '../components/editors/CleanEditor';
import ColorfulEditor from '../components/editors/ColorfulEditor';
import ElegantEditor from '../components/editors/ElegantEditor';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CustomAlert } from '../components/CustomAlert';
import { useAlert } from '../hooks/useAlert';

type TemplateType = 'minimal' | 'clean' | 'colorful' | 'elegant';

export default function TemplateEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { template } = useParams<{ template: TemplateType }>();
  const { state, setFinalResult, setCurrentStep, setTemplate } = usePortfolio();
  const { user } = useAuth();
  const { alertState, hideAlert, success, error: showError, warning } = useAlert();
  const [isValidated, setIsValidated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initializationRef = useRef(false);
  const [currentDocument, setCurrentDocument] = useState<PortfolioDocument | null>(null);
  const [loadedFromDB, setLoadedFromDB] = useState(false);
  const [parsedDocument, setParsedDocument] = useState<PortfolioDocument | null>(null);

  useEffect(() => {
    // Prevent double initialization
    if (initializationRef.current) return;
    initializationRef.current = true;

    console.log('🔍 TemplateEditPage Initialization Debug:');
    console.log('  - URL template param:', template);
    console.log('  - Context selectedTemplate:', state.selectedTemplate);
    console.log('  - Current step:', state.currentStep);
    console.log('  - Location state:', location.state);

    // Validate template parameter first
    const validTemplates = ['minimal', 'clean', 'colorful', 'elegant'];
    if (!template || !validTemplates.includes(template)) {
      console.log('❌ Invalid template, redirecting to /template');
      navigate('/template', { replace: true });
      return;
    }

    // Check if we have portfolioData from MyPage (direct DB edit mode)
    const locationState = location.state as any;
    if (locationState?.portfolioData && locationState?.editMode) {
      console.log('✅ Loading portfolio from DB (direct edit mode)');
      setLoadedFromDB(true);
      setTemplate(template);
      setCurrentStep('enhanced-edit');
      setIsValidated(true);
      return;
    }

    // Check required data
    if (!state.initialResult) {
      console.log('❌ No initialResult, checking other conditions...');
      if (!state.selectedTemplate) {
        console.log('❌ No selectedTemplate, redirecting to /template');
        navigate('/template', { replace: true });
      } else if (!state.organizedContent) {
        console.log('❌ No organizedContent, redirecting to /organize');
        navigate('/organize', { replace: true });
      } else {
        console.log('❌ Missing data, redirecting to /autofill');
        navigate('/autofill', { replace: true });
      }
      return;
    }

    // Set current step and sync template only once
    setCurrentStep('enhanced-edit');
    if (template !== state.selectedTemplate) {
      console.log(`🔄 Template mismatch: URL(${template}) !== Context(${state.selectedTemplate}), updating context`);
      setTemplate(template);
    } else {
      console.log(`✅ Template match: URL(${template}) === Context(${state.selectedTemplate})`);
    }

    setIsValidated(true);
    console.log('✅ TemplateEditPage initialized successfully');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Separate effect to handle template changes from URL
  useEffect(() => {
    if (isValidated && template && template !== state.selectedTemplate) {
      console.log(`🔄 URL Template Change: ${template} !== ${state.selectedTemplate}, updating context`);
      setTemplate(template);
    }
  }, [template, isValidated, state.selectedTemplate, setTemplate]);

  // 현재 문서 업데이트 (에디터에서 변경사항 추적)
  const handleDocumentChange = (document: PortfolioDocument) => {
    console.log('📝 Document changed:', document);
    setCurrentDocument(document);
  };

  // parsedDocument 로드 및 초기화
  useEffect(() => {
    if (!isValidated || parsedDocument) return;

    const locationState = location.state as any;
    let docToSet: PortfolioDocument | null = null;

    // DB에서 로드된 경우 (마이페이지에서 편집)
    if (loadedFromDB && locationState?.portfolioData) {
      console.log('📦 Using portfolio data from DB:', locationState.portfolioData);

      const dbSections = locationState.portfolioData.sections;

      // sections가 이미 document 구조를 가지고 있는지 확인
      if (dbSections && typeof dbSections === 'object') {
        // sections 자체가 document 객체인 경우 (sections.sections가 배열)
        if (dbSections.sections && Array.isArray(dbSections.sections)) {
          docToSet = dbSections;
          console.log('📦 Format: Full document with sections array');
        } else if (Array.isArray(dbSections)) {
          // sections가 배열인 경우 (레거시 구조)
          docToSet = {
            doc_id: locationState.portfolioData.portfolio_id?.toString() || 'db-doc',
            user_id: locationState.portfolioData.user_id?.toString() || 'unknown',
            sections: dbSections,
            created_at: locationState.portfolioData.created_at || new Date().toISOString(),
            updated_at: locationState.portfolioData.updated_at || new Date().toISOString()
          };
          console.log('📦 Format: Wrapped sections array');
        } else if (dbSections.doc_id || dbSections.user_id) {
          // sections가 전체 document 객체인 경우
          docToSet = dbSections;
          console.log('📦 Format: Document object');
        } else {
          // sections가 HTML 문자열을 포함한 구조가 아닌 경우 - AI 분석 원시 데이터
          console.warn('⚠️ DB sections does not contain proper PortfolioDocument structure');
          console.log('⚠️ DB sections structure:', JSON.stringify(dbSections).substring(0, 200));

          // AI 분석 원시 데이터를 extractedData로 포함한 document 구조 생성
          // 에디터가 이 extractedData를 읽어서 HTML을 생성할 수 있음
          docToSet = {
            doc_id: locationState.portfolioData.portfolio_id?.toString() || 'db-doc',
            user_id: locationState.portfolioData.user_id?.toString() || 'unknown',
            sections: [{
              section_id: 'main',
              section_title: 'Portfolio',
              blocks: [{
                block_id: 'content',
                section_id: 'main',
                text: '', // HTML은 비어있지만
                origin: 'user_provided' as const,
                confidence: 1,
                created_at: new Date().toISOString(),
                created_by: 'user',
                extractedData: dbSections // AI 분석 원시 데이터를 여기에 저장
              }]
            }],
            created_at: locationState.portfolioData.created_at || new Date().toISOString(),
            updated_at: locationState.portfolioData.updated_at || new Date().toISOString()
          };
          console.log('📦 Format: Created document structure with extractedData from AI analysis');
        }
      } else {
        docToSet = locationState.portfolioData;
        console.log('📦 Format: Direct portfolio data');
      }

      console.log('📦 Final parsed document structure:', {
        hasSections: !!docToSet?.sections,
        sectionsLength: docToSet?.sections?.length,
        firstSection: docToSet?.sections?.[0] ? 'exists' : 'missing',
        firstBlock: docToSet?.sections?.[0]?.blocks?.[0] ? 'exists' : 'missing'
      });
    } else if (state.initialResult) {
      // 일반 플로우 (autofill에서 생성된 데이터)
      try {
        docToSet = JSON.parse(state.initialResult.content);
        console.log('📦 Parsed from initialResult');
      } catch (error) {
        console.error('Failed to parse initialResult.content:', error);
      }
    }

    if (docToSet) {
      setParsedDocument(docToSet);
      setCurrentDocument(docToSet);
      console.log('🔧 Initialized parsedDocument and currentDocument');
    }
  }, [isValidated, loadedFromDB, location.state, state.initialResult, parsedDocument]);

  // 저장하기 - DB 저장 후 마이페이지로 이동 (완성 페이지 건너뜀)
  const handleSaveOnly = async () => {
    if (!user) {
      warning('로그인이 필요합니다.');
      return;
    }

    if (!currentDocument) {
      warning('저장할 내용이 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 Saving portfolio to DB - currentDocument:', currentDocument);
      console.log('💾 currentDocument structure:', {
        hasSections: !!currentDocument.sections,
        sectionsLength: currentDocument.sections?.length,
        firstBlock: currentDocument.sections?.[0]?.blocks?.[0],
        hasExtractedData: !!currentDocument.sections?.[0]?.blocks?.[0]?.extractedData
      });

      // DB에 저장할 데이터 구조화 (currentDocument를 JSON으로 직렬화)
      const portfolioData = {
        title: `포트폴리오 - ${new Date().toLocaleDateString()}`,
        template_type: template || state.selectedTemplate,
        sections: currentDocument, // 전체 document 객체를 저장
        updated_at: new Date().toISOString()
      };

      console.log('💾 Portfolio data to save:', JSON.stringify(portfolioData).substring(0, 500));

      // 편집 모드인지 확인 (location.state 또는 context에서)
      const locationState = location.state as any;
      const isEditMode = loadedFromDB || (state.editMode && state.portfolioId);
      const portfolioId = locationState?.portfolioData?.portfolio_id || state.portfolioId;

      console.log('🔍 Save mode check:', {
        loadedFromDB,
        isEditMode,
        portfolioId,
        locationPortfolioId: locationState?.portfolioData?.portfolio_id,
        statePortfolioId: state.portfolioId
      });

      if (isEditMode && portfolioId) {
        // 편집 모드: 업데이트
        console.log('📝 Updating portfolio:', portfolioId);
        console.log('📝 Update data:', portfolioData);

        // 먼저 해당 포트폴리오가 존재하는지 확인
        const { data: existingData, error: checkError } = await supabase
          .from('portfolios')
          .select('*')
          .eq('portfolio_id', portfolioId)
          .maybeSingle();

        console.log('🔍 Existing portfolio check:', existingData);
        console.log('🔍 Check error:', checkError);

        const { data, error } = await supabase
          .from('portfolios')
          .update(portfolioData)
          .eq('portfolio_id', portfolioId)
          .select();

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        console.log('✅ Portfolio updated successfully:', data);
        console.log('✅ Updated rows:', data?.length);

        if (!data || data.length === 0) {
          console.warn('⚠️ No rows updated - portfolio might not exist or RLS policy issue');
          // 업데이트 실패 시 새로 삽입 시도
          console.log('🔄 Attempting to insert as new portfolio instead');
          const { error: insertError } = await supabase
            .from('portfolios')
            .insert({
              user_id: user.user_id,
              ...portfolioData,
              published: false
            });

          if (insertError) {
            console.error('❌ Insert error:', insertError);
            throw insertError;
          }
          console.log('✅ Portfolio inserted successfully');
        }

        success('포트폴리오가 저장되었습니다!');
      } else {
        // 신규 작성 모드: 삽입
        console.log('✨ Creating new portfolio');
        const { error } = await supabase
          .from('portfolios')
          .insert({
            user_id: user.user_id,
            ...portfolioData,
            published: false
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('✅ Portfolio saved successfully');
        success('포트폴리오가 저장되었습니다!');
      }
      // 저장 후 마이페이지로 이동하면서 강제 새로고침
      navigate('/mypage', { replace: true, state: { refresh: Date.now() } });
    } catch (error) {
      console.error('저장 오류:', error);
      showError('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 완성하기 - DB 저장 후 완성 페이지로 이동
  const handleComplete = async (document: PortfolioDocument) => {
    if (!user) {
      warning('로그인이 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 Completing and saving portfolio to DB:', document);

      // DB에 저장할 데이터 구조화
      const portfolioData = {
        title: `포트폴리오 - ${new Date().toLocaleDateString()}`,
        template_type: template || state.selectedTemplate,
        sections: document, // 전체 document 객체를 저장
        updated_at: new Date().toISOString()
      };

      // 편집 모드인지 확인
      const locationState = location.state as any;
      const isEditMode = loadedFromDB || (state.editMode && state.portfolioId);
      const portfolioId = locationState?.portfolioData?.portfolio_id || state.portfolioId;

      if (isEditMode && portfolioId) {
        // 편집 모드: 업데이트
        console.log('📝 Updating portfolio:', portfolioId);
        const { error } = await supabase
          .from('portfolios')
          .update(portfolioData)
          .eq('portfolio_id', portfolioId);
        if (error) throw error;
      } else {
        // 신규 작성 모드: 삽입
        console.log('✨ Creating new portfolio');
        const { error } = await supabase
          .from('portfolios')
          .insert({
            user_id: user.user_id,
            ...portfolioData,
            published: false
          });
        if (error) throw error;
      }

      // Convert PortfolioDocument to GenerationResult format
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
          template: template || 'minimal'
        },
        qualityScore: 90,
        suggestions: ['상세 편집 완료']
      };
      setFinalResult(result);
      setCurrentStep('complete');
      navigate('/complete');
    } catch (error) {
      console.error('저장 오류:', error);
      showError('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('autofill');
    navigate('/autofill');
  };

  const handleTemplateChange = (newTemplate: TemplateType) => {
    // 새 템플릿으로 라우팅
    navigate(`/edit/${newTemplate}`);
  };

  // Show loading only when not validated yet or parsedDocument is not ready
  if (!isValidated || !template || !parsedDocument) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <p className="text-gray-600">페이지를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  // 템플릿별 편집기 컴포넌트 선택
  const getEditorComponent = () => {
    const commonProps = {
      document: parsedDocument,
      selectedTemplate: template,
      onSave: handleComplete,
      onSaveOnly: handleSaveOnly,
      onDocumentChange: handleDocumentChange,
      onBack: handleBack,
      onTemplateChange: handleTemplateChange,
      isSaving: isSaving
    };

    console.log('🎯 Getting Editor Component:');
    console.log('  - template param:', template);
    console.log('  - selectedTemplate prop:', commonProps.selectedTemplate);
    console.log('  - parsedDocument present:', !!parsedDocument);

    switch (template) {
      case 'minimal':
        console.log('📝 Rendering MinimalEditor');
        return <MinimalEditor {...commonProps} />;
      case 'clean':
        console.log('📝 Rendering CleanEditor');
        return <CleanEditor {...commonProps} />;
      case 'colorful':
        console.log('📝 Rendering ColorfulEditor');
        return <ColorfulEditor {...commonProps} />;
      case 'elegant':
        console.log('📝 Rendering ElegantEditor');
        return <ElegantEditor {...commonProps} />;
      default:
        console.log('📝 Rendering default MinimalEditor (fallback)');
        return <MinimalEditor {...commonProps} />;
    }
  };

  return (
    <MainLayout>
      {getEditorComponent()}

      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
      />
    </MainLayout>
  );
}