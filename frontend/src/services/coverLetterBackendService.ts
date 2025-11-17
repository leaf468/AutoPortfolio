import { CoverLetterQuestion } from '../components/CoverLetterQuestionInput';
import { CompleteFeedbackReport } from './detailedFeedbackService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/**
 * 백엔드 API를 통해 자소서 첨삭 생성
 */
export async function generateFeedbackViaBackend(
  questions: CoverLetterQuestion[],
  position: string,
  userGpa?: string,
  userCertificates?: string[],
  userToeic?: number
): Promise<CompleteFeedbackReport> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cover-letter/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions: questions.map(q => ({
          question: q.question,
          answer: q.answer
        })),
        position,
        userGpa,
        userCertificates,
        userToeic
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API 호출 실패: ${response.status}`);
    }

    const report: CompleteFeedbackReport = await response.json();

    return report;

  } catch (error: any) {
    throw new Error(`첨삭 생성 실패: ${error.message}`);
  }
}
