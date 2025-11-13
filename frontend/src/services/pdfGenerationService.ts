import jsPDF from 'jspdf';
import { CompleteFeedbackReport, DetailedQuestionFeedback } from './detailedFeedbackService';

// 색상 정의 (Python 코드의 HexColor 스타일)
const COLORS = {
  primary: '#00A6C9',      // 메인 컬러
  secondary: '#59C0DA',    // 보조 컬러
  accent: '#00B6EF',       // 강조 컬러
  text: '#595959',         // 본문 텍스트
  white: '#ffffff',
  success: '#00AA00',
  error: '#CC0000',
  warning: '#FF8896',
  background: '#F6FBFD',
};

/**
 * 한글을 이미지로 변환하여 PDF에 추가하는 방식으로 우회
 * (jsPDF는 한글 폰트 임베딩이 복잡하므로 텍스트를 HTML Canvas로 렌더링)
 */
function addKoreanText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number;
    fontWeight?: string;
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
    color?: string;
  } = {}
): number {
  const {
    fontSize = 12,
    fontWeight = 'normal',
    maxWidth = 180,
    align = 'left',
    color = '#000000'
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return y;

  // DPI 스케일 적용 (고해상도)
  const dpiScale = 3;
  const scaledFontSize = fontSize * dpiScale;

  // 폰트 설정
  ctx.font = `${fontWeight} ${scaledFontSize}px "Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif`;

  // 텍스트를 줄바꿈 처리
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  const maxWidthPx = maxWidth * 3.7795275591; // mm to px (96 DPI 기준)

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width / dpiScale;

    if (testWidth > maxWidthPx && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }

  // 각 줄을 PDF에 추가
  let currentY = y;
  const lineHeight = fontSize * 1.2; // 줄 간격 최적화 (1.3 → 1.2)

  lines.forEach(line => {
    // Canvas 크기 설정
    const metrics = ctx.measureText(line);
    canvas.width = (metrics.width + 20);
    canvas.height = scaledFontSize * 1.5;

    // 다시 폰트 설정 (canvas 크기 변경 시 리셋됨)
    ctx.font = `${fontWeight} ${scaledFontSize}px "Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';

    // 텍스트 그리기
    ctx.fillText(line, 10, 0);

    // Canvas를 이미지로 변환하여 PDF에 추가
    try {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width / dpiScale * 0.26458; // px to mm
      const imgHeight = canvas.height / dpiScale * 0.26458;

      let finalX = x;
      if (align === 'center') {
        finalX = (doc.internal.pageSize.width - imgWidth) / 2;
      } else if (align === 'right') {
        finalX = doc.internal.pageSize.width - x - imgWidth;
      }

      doc.addImage(imgData, 'PNG', finalX, currentY, imgWidth, imgHeight);
    } catch (e) {
      console.error('이미지 추가 실패:', e);
    }

    currentY += lineHeight;
  });

  return currentY;
}

/**
 * 구분선 그리기 (Python 코드의 HRFlowable 스타일)
 */
function addHorizontalRule(
  doc: jsPDF,
  y: number,
  options: {
    width?: number;
    thickness?: number;
    color?: string;
    leftMargin?: number;
  } = {}
): number {
  const {
    width = 170,
    thickness = 0.5,
    color = COLORS.secondary,
    leftMargin = 15,
  } = options;

  doc.setDrawColor(color);
  doc.setLineWidth(thickness);
  doc.line(leftMargin, y, leftMargin + width, y);

  return y + thickness;
}

/**
 * 박스 배경 그리기
 */
function addBackgroundBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void {
  doc.setFillColor(color);
  doc.rect(x, y, width, height, 'F');
}

/**
 * 페이지 여백 설정 (Python 코드와 동일)
 */
const PAGE_MARGIN = {
  left: 19.1,    // 1.91cm
  right: 19.1,
  top: 25.4,     // 2.54cm
  bottom: 20,    // 2.0cm
};

const CONTENT_WIDTH = 210 - (PAGE_MARGIN.left + PAGE_MARGIN.right); // A4 width - margins
const PAGE_BREAK_THRESHOLD = 250; // 페이지 하단 여백 확보 (270mm → 250mm로 보수적 조정)

/**
 * 첨삭 리포트를 PDF로 생성
 */
export async function generateFeedbackPDF(report: CompleteFeedbackReport): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // ═══════════════════════════════════════
  // 표지 페이지 (Python 코드의 표지 스타일)
  // ═══════════════════════════════════════
  let currentY = 60;

  // 메인 제목 (대괄호 스타일)
  currentY = addKoreanText(doc, '[  자기소개서 첨삭 리포트  ]', PAGE_MARGIN.left, currentY, {
    fontSize: 26,
    fontWeight: 'bold',
    align: 'center',
    color: COLORS.text,
  });

  currentY += 30;

  // 점수 배경 박스
  const scoreBoxHeight = 40;
  addBackgroundBox(
    doc,
    PAGE_MARGIN.left,
    currentY,
    CONTENT_WIDTH,
    scoreBoxHeight,
    COLORS.background
  );

  currentY += 15;
  currentY = addKoreanText(doc, `종합 점수`, PAGE_MARGIN.left, currentY, {
    fontSize: 18,
    fontWeight: 'bold',
    align: 'center',
    color: COLORS.primary,
  });

  currentY += 10;
  currentY = addKoreanText(doc, `${report.averageScore}점 / 100점`, PAGE_MARGIN.left, currentY, {
    fontSize: 24,
    fontWeight: 'bold',
    align: 'center',
    color: COLORS.accent,
  });

  currentY += 25;

  // 직무 정보
  currentY = addKoreanText(doc, `직무: ${report.position}`, PAGE_MARGIN.left, currentY, {
    fontSize: 14,
    align: 'center',
    color: COLORS.text,
  });

  currentY += 10;
  const date = new Date(report.createdAt).toLocaleDateString('ko-KR');
  currentY = addKoreanText(doc, `작성일: ${date}`, PAGE_MARGIN.left, currentY, {
    fontSize: 12,
    align: 'center',
    color: COLORS.text,
  });

  // ═══════════════════════════════════════
  // 각 질문별 첨삭 (본문 페이지)
  // ═══════════════════════════════════════
  report.questionFeedbacks.forEach((feedback, index) => {
    // 새 페이지 시작 (첫 페이지는 표지 다음)
    doc.addPage();
    currentY = PAGE_MARGIN.top;

    // ─────────────────────────────────────
    // 페이지 제목 (Python 스타일의 sectionHeadingStyle)
    // ─────────────────────────────────────
    currentY = addKoreanText(doc, `[  질문 ${feedback.questionNumber}  ]`, PAGE_MARGIN.left, currentY, {
      fontSize: 22,
      fontWeight: 'bold',
      align: 'center',
      color: COLORS.text,
    });

    currentY += 8;

    // 질문 내용
    currentY = addKoreanText(doc, '질문내용', PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 4;
    currentY = addKoreanText(doc, feedback.question, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      maxWidth: CONTENT_WIDTH - 10,
      color: COLORS.text,
      fontWeight: 'bold',
    });

    // 사용자 입력 답변 추가
    currentY += 5;
    currentY = addKoreanText(doc, '귀하의 답변', PAGE_MARGIN.left, currentY, {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 4;
    currentY = addKoreanText(doc, feedback.userAnswer, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 10,
      color: COLORS.text,
    });

    // ─────────────────────────────────────
    // 종합 평가 섹션
    // ─────────────────────────────────────
    // 페이지 넘김 방지: 종합 평가 섹션이 페이지 하단에 걸치면 새 페이지로
    if (currentY > 230) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 8;
    }

    currentY = addKoreanText(doc, '종합평가', PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 4;
    currentY = addKoreanText(doc, `종합 점수: ${feedback.overallScore}점 / 100점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.accent,
    });

    currentY += 6;
    currentY = addKoreanText(doc, feedback.overallSummary, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 10,
      color: COLORS.text,
    });

    // ─────────────────────────────────────
    // 구조 분석 섹션 (세부 점수 포함)
    // ─────────────────────────────────────
    if (currentY > 220) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 10;
    }

    currentY = addKoreanText(doc, `구조 분석 (총점: ${feedback.structureAnalysis.totalScore}점)`, PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    // 세부 점수: 논리성
    currentY += 5;
    currentY = addKoreanText(doc, `• 논리성 (Logic): ${feedback.structureAnalysis.logic.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });

    currentY += 4;
    currentY = addKoreanText(doc, feedback.structureAnalysis.logic.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    // 세부 점수: 일관성
    if (currentY > 250) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 5;
    currentY = addKoreanText(doc, `• 일관성 (Consistency): ${feedback.structureAnalysis.consistency.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });

    currentY += 4;
    currentY = addKoreanText(doc, feedback.structureAnalysis.consistency.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    // 세부 점수: 완결성
    if (currentY > 250) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 5;
    currentY = addKoreanText(doc, `• 완결성 (Completeness): ${feedback.structureAnalysis.completeness.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });

    currentY += 4;
    currentY = addKoreanText(doc, feedback.structureAnalysis.completeness.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    // 개선 제안
    if (currentY > 240) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 6;
    currentY = addKoreanText(doc, '개선 제안:', PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });

    feedback.structureAnalysis.suggestions.forEach((suggestion) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = PAGE_MARGIN.top;
      }
      currentY += 4;
      currentY = addKoreanText(doc, `✓ ${suggestion}`, PAGE_MARGIN.left + 10, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 15,
        color: COLORS.text,
      });
    });

    // ─────────────────────────────────────
    // 내용 분석 섹션 (세부 점수 포함)
    // ─────────────────────────────────────
    if (currentY > 200) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 10;
    }

    currentY = addKoreanText(doc, `내용 분석 (총점: ${feedback.contentAnalysis.totalScore}점)`, PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    // 구체성
    currentY += 5;
    currentY = addKoreanText(doc, `• 구체성: ${feedback.contentAnalysis.specificity.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.contentAnalysis.specificity.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    // 직무연관성
    if (currentY > 250) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 5;
    currentY = addKoreanText(doc, `• 직무연관성: ${feedback.contentAnalysis.relevance.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.contentAnalysis.relevance.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    // 차별성
    if (currentY > 250) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 5;
    currentY = addKoreanText(doc, `• 차별성: ${feedback.contentAnalysis.differentiation.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.contentAnalysis.differentiation.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    // 강점/약점
    if (currentY > 240) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 6;
    currentY = addKoreanText(doc, '강점:', PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.success,
    });

    feedback.contentAnalysis.strengths.forEach((strength) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = PAGE_MARGIN.top;
      }
      currentY += 4;
      currentY = addKoreanText(doc, `✓ ${strength}`, PAGE_MARGIN.left + 10, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 15,
        color: COLORS.success,
      });
    });

    if (currentY > 240) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 6;
    currentY = addKoreanText(doc, '약점:', PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.error,
    });

    feedback.contentAnalysis.weaknesses.forEach((weakness) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = PAGE_MARGIN.top;
      }
      currentY += 4;
      currentY = addKoreanText(doc, `✗ ${weakness}`, PAGE_MARGIN.left + 10, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 15,
        color: COLORS.error,
      });
    });

    // ─────────────────────────────────────
    // 표현력 분석 섹션 (세부 점수 포함)
    // ─────────────────────────────────────
    if (currentY > 200) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 10;
    }

    currentY = addKoreanText(doc, `표현력 분석 (총점: ${feedback.expressionAnalysis.totalScore}점)`, PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    // 문장력, 어휘력, 가독성
    currentY += 5;
    currentY = addKoreanText(doc, `• 문장력: ${feedback.expressionAnalysis.writing.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.expressionAnalysis.writing.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    if (currentY > 250) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 5;
    currentY = addKoreanText(doc, `• 어휘력: ${feedback.expressionAnalysis.vocabulary.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.expressionAnalysis.vocabulary.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    if (currentY > 250) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 5;
    currentY = addKoreanText(doc, `• 가독성: ${feedback.expressionAnalysis.readability.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.expressionAnalysis.readability.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    // ─────────────────────────────────────
    // 직무적합성 분석 섹션
    // ─────────────────────────────────────
    if (currentY > 200) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 10;
    }

    currentY = addKoreanText(doc, `직무적합성 분석 (총점: ${feedback.jobFitAnalysis.totalScore}점)`, PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 5;
    currentY = addKoreanText(doc, `• 전문성: ${feedback.jobFitAnalysis.expertise.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.jobFitAnalysis.expertise.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    if (currentY > 250) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 5;
    currentY = addKoreanText(doc, `• 열정: ${feedback.jobFitAnalysis.passion.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.jobFitAnalysis.passion.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    if (currentY > 250) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    }
    currentY += 5;
    currentY = addKoreanText(doc, `• 성장가능성: ${feedback.jobFitAnalysis.growth.score}점`, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.text,
    });
    currentY += 4;
    currentY = addKoreanText(doc, feedback.jobFitAnalysis.growth.feedback, PAGE_MARGIN.left + 10, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 15,
      color: COLORS.text,
    });

    // ─────────────────────────────────────
    // 합격자 비교 분석 섹션
    // ─────────────────────────────────────
    doc.addPage();
    currentY = PAGE_MARGIN.top;

    currentY = addKoreanText(doc, `[  합격자 비교 분석  ]`, PAGE_MARGIN.left, currentY, {
      fontSize: 22,
      fontWeight: 'bold',
      align: 'center',
      color: COLORS.text,
    });

    currentY += 8;

    // 스펙 비교
    currentY = addKoreanText(doc, '스펙 비교', PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 5;
    if (feedback.competitorComparison.specComparison.gpa) {
      currentY = addKoreanText(doc, `• 학점: ${feedback.competitorComparison.specComparison.gpa}`, PAGE_MARGIN.left + 5, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 10,
        color: COLORS.text,
      });
      currentY += 5;
    }
    if (feedback.competitorComparison.specComparison.toeic) {
      currentY = addKoreanText(doc, `• 토익: ${feedback.competitorComparison.specComparison.toeic}`, PAGE_MARGIN.left + 5, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 10,
        color: COLORS.text,
      });
      currentY += 5;
    }
    if (feedback.competitorComparison.specComparison.certificates) {
      currentY = addKoreanText(doc, `• 자격증: ${feedback.competitorComparison.specComparison.certificates}`, PAGE_MARGIN.left + 5, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 10,
        color: COLORS.text,
      });
    }

    // 활동 비교
    currentY += 8;
    currentY = addKoreanText(doc, '활동 비교', PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 5;
    if (feedback.competitorComparison.activityComparison.quantity) {
      currentY = addKoreanText(doc, `• ${feedback.competitorComparison.activityComparison.quantity}`, PAGE_MARGIN.left + 5, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 10,
        color: COLORS.text,
      });
      currentY += 5;
    }
    if (feedback.competitorComparison.activityComparison.quality) {
      currentY = addKoreanText(doc, `• ${feedback.competitorComparison.activityComparison.quality}`, PAGE_MARGIN.left + 5, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 10,
        color: COLORS.text,
      });
      currentY += 5;
    }
    if (feedback.competitorComparison.activityComparison.relevance) {
      currentY = addKoreanText(doc, `• ${feedback.competitorComparison.activityComparison.relevance}`, PAGE_MARGIN.left + 5, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 10,
        color: COLORS.text,
      });
    }

    // 종합 분석
    if (currentY > 220) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 8;
    }

    currentY = addKoreanText(doc, '종합 분석', PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 5;
    currentY = addKoreanText(doc, feedback.competitorComparison.summary, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 10,
      color: COLORS.text,
    });

    // 부족한 요소
    if (currentY > 230) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 8;
    }

    if (feedback.competitorComparison.missingElements.length > 0) {
      currentY = addKoreanText(doc, '부족한 요소:', PAGE_MARGIN.left + 5, currentY, {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.error,
      });

      feedback.competitorComparison.missingElements.forEach((element) => {
        if (currentY > 260) {
          doc.addPage();
          currentY = PAGE_MARGIN.top;
        }
        currentY += 4;
        currentY = addKoreanText(doc, `✗ ${element}`, PAGE_MARGIN.left + 10, currentY, {
          fontSize: 12,
          maxWidth: CONTENT_WIDTH - 15,
          color: COLORS.error,
        });
      });
    }

    // 개선 권장사항
    if (currentY > 230) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 8;
    }

    if (feedback.competitorComparison.recommendations.length > 0) {
      currentY = addKoreanText(doc, '개선 권장사항:', PAGE_MARGIN.left + 5, currentY, {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.primary,
      });

      feedback.competitorComparison.recommendations.forEach((rec) => {
        if (currentY > 260) {
          doc.addPage();
          currentY = PAGE_MARGIN.top;
        }
        currentY += 4;
        currentY = addKoreanText(doc, `→ ${rec}`, PAGE_MARGIN.left + 10, currentY, {
          fontSize: 12,
          maxWidth: CONTENT_WIDTH - 15,
          color: COLORS.primary,
        });
      });
    }

    // ─────────────────────────────────────
    // 수정된 답변 섹션 (새 페이지)
    // ─────────────────────────────────────
    doc.addPage();
    currentY = PAGE_MARGIN.top;

    currentY = addKoreanText(doc, `[  질문 ${feedback.questionNumber} - 수정 제안  ]`, PAGE_MARGIN.left, currentY, {
      fontSize: 22,
      fontWeight: 'bold',
      align: 'center',
      color: COLORS.text,
    });

    currentY += 8;

    currentY = addKoreanText(doc, '수정된 답변', PAGE_MARGIN.left, currentY, {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 4;
    currentY = addKoreanText(doc, feedback.revisedVersion, PAGE_MARGIN.left + 5, currentY, {
      fontSize: 12,
      maxWidth: CONTENT_WIDTH - 10,
      color: COLORS.text,
    });

    // ─────────────────────────────────────
    // 주요 개선 사항
    // ─────────────────────────────────────
    if (currentY > 220) {
      doc.addPage();
      currentY = PAGE_MARGIN.top;
    } else {
      currentY += 10;
    }

    currentY = addKoreanText(doc, '주요 개선 사항', PAGE_MARGIN.left, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.primary,
    });

    currentY += 2;
    currentY = addHorizontalRule(doc, currentY, {
      width: CONTENT_WIDTH,
      thickness: 1.3,
      color: COLORS.secondary,
      leftMargin: PAGE_MARGIN.left,
    });

    currentY += 5;
    feedback.keyImprovements.forEach((improvement, i) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = PAGE_MARGIN.top;
      }
      currentY += 4;
      currentY = addKoreanText(doc, `${i + 1}. ${improvement}`, PAGE_MARGIN.left + 5, currentY, {
        fontSize: 12,
        maxWidth: CONTENT_WIDTH - 10,
        color: COLORS.text,
      });
    });
  });

  // PDF 저장
  const fileName = `자기소개서_첨삭_${report.position}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}
