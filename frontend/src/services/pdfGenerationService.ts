import jsPDF from 'jspdf';
import { CompleteFeedbackReport, DetailedQuestionFeedback } from './detailedFeedbackService';

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

  // 폰트 설정
  ctx.font = `${fontWeight} ${fontSize}px "Noto Sans KR", "Malgun Gothic", sans-serif`;

  // 텍스트를 줄바꿈 처리
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth * 2.83465 && currentLine) { // mm to px conversion
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
  const lineHeight = fontSize * 0.4;

  lines.forEach(line => {
    // Canvas 크기 설정
    const metrics = ctx.measureText(line);
    canvas.width = metrics.width + 10;
    canvas.height = fontSize * 2;

    // 다시 폰트 설정 (canvas 크기 변경 시 리셋됨)
    ctx.font = `${fontWeight} ${fontSize}px "Noto Sans KR", "Malgun Gothic", sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';

    // 텍스트 그리기
    ctx.fillText(line, 0, 0);

    // Canvas를 이미지로 변환하여 PDF에 추가
    try {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = (metrics.width / 2.83465) * 0.26; // px to mm
      const imgHeight = fontSize * 0.35;

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

  return currentY + lineHeight;
}

/**
 * 첨삭 리포트를 PDF로 생성
 */
export async function generateFeedbackPDF(report: CompleteFeedbackReport): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let currentY = 20;

  // 표지
  currentY = addKoreanText(doc, '자기소개서 전문 첨삭 리포트', 15, currentY, {
    fontSize: 24,
    fontWeight: 'bold',
    align: 'center',
  });

  currentY += 5;
  currentY = addKoreanText(doc, `직무: ${report.position}`, 15, currentY, {
    fontSize: 16,
    align: 'center',
  });

  currentY += 3;
  currentY = addKoreanText(doc, `전체 평균 점수: ${report.averageScore}점 / 100점`, 15, currentY, {
    fontSize: 14,
    align: 'center',
    color: '#0066CC',
  });

  currentY += 3;
  const date = new Date(report.createdAt).toLocaleDateString('ko-KR');
  currentY = addKoreanText(doc, `작성일: ${date}`, 15, currentY, {
    fontSize: 12,
    align: 'center',
    color: '#666666',
  });

  // 각 질문별 첨삭
  report.questionFeedbacks.forEach((feedback, index) => {
    // 새 페이지 시작
    if (index > 0) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY += 15;
    }

    // 질문 제목
    currentY = addKoreanText(doc, `질문 ${feedback.questionNumber}`, 15, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
    });

    currentY += 2;
    currentY = addKoreanText(doc, feedback.question, 15, currentY, {
      fontSize: 14,
      color: '#333333',
    });

    // 종합 평가
    currentY += 5;
    currentY = addKoreanText(doc, `종합 점수: ${feedback.overallScore}점`, 15, currentY, {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#0066CC',
    });

    currentY += 3;
    currentY = addKoreanText(doc, feedback.overallSummary, 15, currentY, {
      fontSize: 11,
      maxWidth: 170,
    });

    // 구조 분석
    currentY += 5;
    currentY = addKoreanText(doc, `📋 구조 분석 (${feedback.structureAnalysis.score}점)`, 15, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
    });

    currentY += 2;
    currentY = addKoreanText(doc, feedback.structureAnalysis.feedback, 15, currentY, {
      fontSize: 10,
      maxWidth: 170,
    });

    feedback.structureAnalysis.suggestions.forEach((suggestion, i) => {
      currentY += 2;
      currentY = addKoreanText(doc, `• ${suggestion}`, 20, currentY, {
        fontSize: 10,
        maxWidth: 165,
      });
    });

    // 페이지 넘김 체크
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // 내용 분석
    currentY += 5;
    currentY = addKoreanText(doc, `📝 내용 분석 (${feedback.contentAnalysis.score}점)`, 15, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
    });

    currentY += 2;
    currentY = addKoreanText(doc, feedback.contentAnalysis.feedback, 15, currentY, {
      fontSize: 10,
      maxWidth: 170,
    });

    currentY += 3;
    currentY = addKoreanText(doc, '강점:', 20, currentY, {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#00AA00',
    });

    feedback.contentAnalysis.strengths.forEach(strength => {
      currentY += 2;
      currentY = addKoreanText(doc, `✓ ${strength}`, 25, currentY, {
        fontSize: 10,
        maxWidth: 160,
        color: '#00AA00',
      });
    });

    currentY += 3;
    currentY = addKoreanText(doc, '약점:', 20, currentY, {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#CC0000',
    });

    feedback.contentAnalysis.weaknesses.forEach(weakness => {
      currentY += 2;
      currentY = addKoreanText(doc, `✗ ${weakness}`, 25, currentY, {
        fontSize: 10,
        maxWidth: 160,
        color: '#CC0000',
      });
    });

    // 새 페이지로 (수정 제안)
    doc.addPage();
    currentY = 20;

    currentY = addKoreanText(doc, `질문 ${feedback.questionNumber} - 수정 제안`, 15, currentY, {
      fontSize: 16,
      fontWeight: 'bold',
    });

    currentY += 5;
    currentY = addKoreanText(doc, '수정된 답변:', 15, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#0066CC',
    });

    currentY += 3;
    currentY = addKoreanText(doc, feedback.revisedVersion, 15, currentY, {
      fontSize: 10,
      maxWidth: 170,
    });

    currentY += 5;
    currentY = addKoreanText(doc, '주요 개선 사항:', 15, currentY, {
      fontSize: 13,
      fontWeight: 'bold',
    });

    feedback.keyImprovements.forEach((improvement, i) => {
      currentY += 3;
      currentY = addKoreanText(doc, `${i + 1}. ${improvement}`, 20, currentY, {
        fontSize: 10,
        maxWidth: 165,
      });
    });
  });

  // PDF 저장
  const fileName = `자기소개서_첨삭_${report.position}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}
