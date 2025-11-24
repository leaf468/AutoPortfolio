import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FieldBasedQuestion,
  FieldType,
  MotivationFields,
  ExperienceFields,
  StrengthFields,
  VisionFields,
  GrowthFields,
  FailureFields,
  TeamworkFields,
  ConflictFields,
  AIFeedback,
} from '../types/fieldBasedCoverLetter';
import { FieldBasedQuestionCard } from '../components/FieldBasedQuestionCard';
import { CustomQuestionModal } from '../components/CustomQuestionModal';
import { CustomFieldDefinition } from '../services/customQuestionAnalyzer';
import { useAuth } from '../contexts/AuthContext';
import { generateFeedbackViaBackend } from '../services/coverLetterBackendService';
import { CustomAlert } from '../components/CustomAlert';
import { useAlert } from '../hooks/useAlert';
import Footer from '../components/Footer';
import { saveFieldBasedCoverLetter, updateFieldBasedCoverLetter, convertFieldBasedToRegular } from '../services/fieldBasedCoverLetterService';
import { supabase } from '../lib/supabaseClient';
import { trackButtonClick } from '../utils/analytics';

const createEmptyMotivationFields = (company: string, position: string): MotivationFields => ({
  companyName: company,
  position: position,
  whenKnew: '',
  whatAttracted: '',
  whyThis: '',
  personalGoal: '',
  howAlign: '',
});

const createEmptyExperienceFields = (): ExperienceFields => ({
  projectName: '',
  period: '',
  teamSize: '',
  myRole: '',
  technologies: [],
  problem: '',
  solution: '',
  achievementMetric: '',
  difficulty: '',
  howOvercome: '',
  lesson: '',
});

const createEmptyStrengthFields = (): StrengthFields => ({
  mainStrength: '',
  whyStrength: '',
  when: '',
  situation: '',
  action: '',
  result: '',
  feedback: '',
  relevance: '',
});

const createEmptyVisionFields = (): VisionFields => ({
  shortTermGoal: '',
  shortTermAction: '',
  mediumTermGoal: '',
  mediumTermAction: '',
  longTermVision: '',
  longTermAction: '',
  companyContribution: '',
  specificValue: '',
});

const createEmptyGrowthFields = (): GrowthFields => ({
  backgroundSummary: '',
  keyEvent: '',
  whenOccurred: '',
  whatHappened: '',
  howInfluenced: '',
  currentImpact: '',
  relatedValue: '',
});

const createEmptyFailureFields = (): FailureFields => ({
  situationDesc: '',
  whatFailed: '',
  whyFailed: '',
  emotionalImpact: '',
  turningPoint: '',
  actionTaken: '',
  result: '',
  lessonLearned: '',
  howApply: '',
});

const createEmptyTeamworkFields = (): TeamworkFields => ({
  projectContext: '',
  teamSize: '',
  myRole: '',
  challenge: '',
  whyDifficult: '',
  approach: '',
  communicationMethod: '',
  result: '',
  teamFeedback: '',
  lessonsOnTeamwork: '',
});

const createEmptyConflictFields = (): ConflictFields => ({
  situation: '',
  parties: '',
  cause: '',
  myPosition: '',
  otherPosition: '',
  approachTaken: '',
  communication: '',
  compromise: '',
  outcome: '',
  lessonsLearned: '',
});

export const FieldBasedCoverLetterPage: React.FC = () => {
  const { user } = useAuth();
  const { alertState, hideAlert, success, error: showError, warning } = useAlert();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [questions, setQuestions] = useState<FieldBasedQuestion[]>([]);
  const [feedbacks, setFeedbacks] = useState<AIFeedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documentId, setDocumentId] = useState<number | undefined>(undefined);

  // 사용자 프로필 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('company, position')
          .eq('user_id', user.user_id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          return;
        }

        if (data) {
          if (data.company) setCompanyName(data.company);
          if (data.position) setPosition(data.position);
        }
      } catch (error) {
        // 프로필 로드 실패 시 무시
      }
    };

    loadUserProfile();
  }, [user]);

  const handleQuestionUpdate = (index: number, updatedQuestion: FieldBasedQuestion) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? updatedQuestion : q))
    );
  };

  const handleQuestionRemove = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = (fieldType: FieldType) => {
    trackButtonClick(`질문 추가: ${fieldType}`, 'FieldBasedCoverLetterPage');
    if (fieldType === 'custom') {
      setIsCustomModalOpen(true);
      return;
    }

    let fields: any;
    let questionText = '';
    let maxLength = 1000;

    switch (fieldType) {
      case 'motivation':
        fields = createEmptyMotivationFields(companyName, position);
        questionText = '지원 동기를 작성해주세요.';
        break;
      case 'experience':
        fields = createEmptyExperienceFields();
        questionText = '관련 경험이나 프로젝트를 설명해주세요.';
        maxLength = 1500;
        break;
      case 'strength':
        fields = createEmptyStrengthFields();
        questionText = '본인의 강점과 역량을 작성해주세요.';
        break;
      case 'vision':
        fields = createEmptyVisionFields();
        questionText = '입사 후 포부와 목표를 작성해주세요.';
        maxLength = 800;
        break;
      case 'growth':
        fields = createEmptyGrowthFields();
        questionText = '자신의 성장과정을 간략히 기술해주세요.';
        maxLength = 1200;
        break;
      case 'failure':
        fields = createEmptyFailureFields();
        questionText = '실패나 좌절 경험과 극복 과정을 기술해주세요.';
        maxLength = 1200;
        break;
      case 'teamwork':
        fields = createEmptyTeamworkFields();
        questionText = '팀 프로젝트에서 협력했던 경험을 기술해주세요.';
        maxLength = 1200;
        break;
      case 'conflict':
        fields = createEmptyConflictFields();
        questionText = '갈등 상황과 해결 과정을 기술해주세요.';
        maxLength = 1200;
        break;
      default:
        fields = {};
        questionText = '새로운 질문을 입력하세요.';
    }

    const newQuestion: FieldBasedQuestion = {
      id: `q${Date.now()}`,
      question: questionText,
      fieldType,
      fields,
      generatedAnswer: '',
      maxLength,
    };

    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleCustomQuestionSubmit = (
    questionText: string,
    fieldDefinitions: CustomFieldDefinition[],
    explanation: string
  ) => {
    const initialFields: Record<string, string> = {};
    fieldDefinitions.forEach((fieldDef) => {
      initialFields[fieldDef.key] = '';
    });

    const newQuestion: FieldBasedQuestion = {
      id: `q${Date.now()}`,
      question: questionText,
      fieldType: 'custom',
      fields: initialFields,
      generatedAnswer: '',
      maxLength: 1500,
      customFieldDefinitions: fieldDefinitions,
      customExplanation: explanation,
    };

    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleGetAIFeedback = async () => {
    trackButtonClick('AI 첨삭 받기', 'FieldBasedCoverLetterPage');
    if (!user) {
      warning('로그인이 필요합니다.');
      return;
    }

    const answeredQuestions = questions.filter((q) => {
      const answer = q.editedAnswer || q.generatedAnswer;
      return answer.trim().length > 0;
    });

    if (answeredQuestions.length === 0) {
      warning('최소 하나 이상의 질문에 답변해주세요.');
      return;
    }

    setIsLoadingFeedback(true);

    try {
      const report = await generateFeedbackViaBackend(
        answeredQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          answer: q.editedAnswer || q.generatedAnswer,
          placeholder: '',
          maxLength: q.maxLength,
        })),
        position
      );

      // AI 피드백 저장
      const newFeedbacks: AIFeedback[] = report.questionFeedbacks.map((feedback, index) => ({
        questionId: answeredQuestions[index].id,
        score: feedback.overallScore || 0,
        strengths: feedback.contentAnalysis.strengths || [],
        improvements: feedback.contentAnalysis.weaknesses || [],
        suggestions: feedback.keyImprovements || [],
        generatedAt: new Date(),
      }));

      setFeedbacks(newFeedbacks);
      success('AI 피드백이 생성되었습니다!');
    } catch (err) {
      showError('AI 피드백 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleSave = async () => {
    trackButtonClick('자소서 저장', 'FieldBasedCoverLetterPage');
    if (!user) {
      warning('로그인이 필요합니다.');
      return;
    }

    if (!companyName.trim() || !position.trim()) {
      warning('회사명과 직무를 입력해주세요.');
      return;
    }

    if (questions.length === 0) {
      warning('최소 하나 이상의 질문을 추가해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      if (documentId) {
        // 업데이트
        const result = await updateFieldBasedCoverLetter(
          documentId,
          companyName,
          position,
          questions
        );

        if (result.success) {
          success('자소서가 수정되었습니다.');
        } else {
          showError(result.message || '수정에 실패했습니다.');
        }
      } else {
        // 새로 저장
        const result = await saveFieldBasedCoverLetter(
          user.user_id,
          companyName,
          position,
          questions
        );

        if (result.success && result.documentId) {
          setDocumentId(result.documentId);
          success('자소서가 저장되었습니다.');
        } else {
          showError(result.message || '저장에 실패했습니다.');
        }
      }
    } catch (err) {
      showError('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadToRegularEditor = () => {
    trackButtonClick('포트폴리오 만들기', 'FieldBasedCoverLetterPage');
    if (!companyName.trim() || !position.trim()) {
      warning('회사명과 직무를 먼저 입력해주세요.');
      return;
    }

    if (questions.length === 0) {
      warning('최소 하나 이상의 질문을 추가해주세요.');
      return;
    }

    // 필드 기반 데이터를 일반 자소서 형식으로 변환
    const regularQuestions = convertFieldBasedToRegular({
      companyName,
      position,
      questions,
      feedbacks,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 게스트 모드 확인
    const urlParams = new URLSearchParams(window.location.search);
    const isGuest = urlParams.get('mode') === 'guest';

    // 일반 자소서 페이지로 이동하면서 데이터 전달
    navigate(`/cover-letter-basic${isGuest ? '?mode=guest' : ''}`, {
      state: {
        fromFieldBased: true,
        companyName,
        position,
        questions: regularQuestions,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to={user ? '/mypage' : '/'}>
                <img
                  src="/Careeroad_logo.png"
                  alt="Careeroad"
                  className="h-20 w-auto cursor-pointer"
                />
              </Link>
              <div className="border-l-2 border-gray-300 pl-4 py-1">
                <h1 className="text-xl font-bold text-gray-900">
                  자소서 작성
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  질문을 선택하고 핵심 내용을 입력하세요
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/cover-letter-basic"
                className="text-sm text-gray-700 hover:text-blue-600 transition font-medium whitespace-nowrap"
              >
                자유 작성 모드
              </Link>
              <Link
                to="/mypage"
                className="text-sm text-gray-700 hover:text-blue-600 transition font-medium whitespace-nowrap"
              >
                마이페이지
              </Link>
              <button
                onClick={handleLoadToRegularEditor}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium whitespace-nowrap"
              >
                자소서 편집하기
              </button>
              {user && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? '저장 중...' : '저장하기'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex-1">
        {/* 안내 문구 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                작성 방법
              </h3>

              <div className="space-y-2.5 text-base text-gray-700 leading-relaxed">
                <p><strong className="text-blue-700">1.</strong> 아래에서 답변하고 싶은 질문을 선택하세요</p>
                <p><strong className="text-blue-700">2.</strong> 질문을 펼쳐서 핵심 내용을 입력하고 AI로 답변을 생성하거나, 건너뛸 수 있어요</p>
                <p><strong className="text-blue-700">3.</strong> 상단의 <strong className="text-green-600">'자소서 편집하기'</strong> 버튼을 눌러 본격적으로 작성하세요</p>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200 text-sm text-gray-600">
                💬 빈 화면에서 바로 작성하고 싶다면 상단의 <strong>'자유 작성 모드'</strong>를 클릭하세요
              </div>
            </div>
          </div>
        </div>

        {/* 기본 정보 입력 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지원 회사 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="예: 네이버"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지원 직무 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="예: 백엔드 개발자"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {questions.length > 0 && (
          <>
            {/* 질문 목록 */}
            <div className="space-y-6 mb-8">
              {questions.map((question, index) => (
                <FieldBasedQuestionCard
                  key={question.id}
                  question={question}
                  questionIndex={index}
                  onUpdate={(updated) => handleQuestionUpdate(index, updated)}
                  onRemove={() => handleQuestionRemove(index)}
                />
              ))}
            </div>

            {/* 자소서 문항 선택 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">자소서 문항 선택하기</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => handleAddQuestion('motivation')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">지원 동기</div>
                  <div className="text-sm text-gray-600 mt-1">회사/직무를 선택한 이유와 목표</div>
                </button>
                <button
                  onClick={() => handleAddQuestion('experience')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">경험/프로젝트 추가</div>
                  <div className="text-sm text-gray-600 mt-1">프로젝트, 활동 등 (여러 개 추가 가능)</div>
                </button>
                <button
                  onClick={() => handleAddQuestion('strength')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">강점/역량 추가</div>
                  <div className="text-sm text-gray-600 mt-1">본인의 강점 (여러 개 추가 가능)</div>
                </button>
                <button
                  onClick={() => handleAddQuestion('vision')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">포부/목표</div>
                  <div className="text-sm text-gray-600 mt-1">입사 후 이루고 싶은 것</div>
                </button>
                <button
                  onClick={() => handleAddQuestion('growth')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">성장 과정</div>
                  <div className="text-sm text-gray-600 mt-1">본인의 성장 스토리</div>
                </button>
                <button
                  onClick={() => handleAddQuestion('failure')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">실패/극복</div>
                  <div className="text-sm text-gray-600 mt-1">실패 경험과 극복 과정</div>
                </button>
                <button
                  onClick={() => handleAddQuestion('teamwork')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">협업/리더십</div>
                  <div className="text-sm text-gray-600 mt-1">팀 프로젝트 협업 경험</div>
                </button>
                <button
                  onClick={() => handleAddQuestion('conflict')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">갈등 해결</div>
                  <div className="text-sm text-gray-600 mt-1">갈등 상황 및 해결 과정</div>
                </button>
                <button
                  onClick={() => handleAddQuestion('custom')}
                  className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">직접 입력하기</div>
                  <div className="text-sm text-gray-600 mt-1">AI가 질문을 분석하여 필드 생성</div>
                </button>
              </div>
            </div>

          </>
        )}

        {/* 자소서 문항 선택 안내 */}
        {questions.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">자소서 문항 선택하기</h3>
            <p className="text-sm text-gray-600 mb-4">답변하고 싶은 문항을 선택하세요. 여러 개 선택 가능합니다.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => handleAddQuestion('motivation')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">지원 동기</div>
                <div className="text-sm text-gray-600 mt-1">회사/직무를 선택한 이유와 목표</div>
              </button>
              <button
                onClick={() => handleAddQuestion('experience')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">경험/프로젝트 추가</div>
                <div className="text-sm text-gray-600 mt-1">프로젝트, 활동 등 (여러 개 추가 가능)</div>
              </button>
              <button
                onClick={() => handleAddQuestion('strength')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">강점/역량 추가</div>
                <div className="text-sm text-gray-600 mt-1">본인의 강점 (여러 개 추가 가능)</div>
              </button>
              <button
                onClick={() => handleAddQuestion('vision')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">포부/목표</div>
                <div className="text-sm text-gray-600 mt-1">입사 후 이루고 싶은 것</div>
              </button>
              <button
                onClick={() => handleAddQuestion('growth')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">성장 과정</div>
                <div className="text-sm text-gray-600 mt-1">본인의 성장 스토리</div>
              </button>
              <button
                onClick={() => handleAddQuestion('failure')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">실패/극복</div>
                <div className="text-sm text-gray-600 mt-1">실패 경험과 극복 과정</div>
              </button>
              <button
                onClick={() => handleAddQuestion('teamwork')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">협업/리더십</div>
                <div className="text-sm text-gray-600 mt-1">팀 프로젝트 협업 경험</div>
              </button>
              <button
                onClick={() => handleAddQuestion('conflict')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">갈등 해결</div>
                <div className="text-sm text-gray-600 mt-1">갈등 상황 및 해결 과정</div>
              </button>
              <button
                onClick={() => handleAddQuestion('custom')}
                className="px-6 py-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="font-semibold text-gray-900">직접 입력하기</div>
                <div className="text-sm text-gray-600 mt-1">AI가 질문을 분석하여 필드 생성</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />

      <CustomQuestionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={handleCustomQuestionSubmit}
      />

      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
      />
    </div>
  );
};

export default FieldBasedCoverLetterPage;
