import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * POST /api/cover-letter/feedback
 * 자소서 첨삭 생성
 */
router.post('/feedback', async (req, res) => {
  try {
    const { questions, position, userGpa, userCertificates, userToeic } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: '질문이 필요합니다.' });
    }

    if (!position) {
      return res.status(400).json({ error: '직무가 필요합니다.' });
    }

    console.log('📝 첨삭 요청 받음:', {
      questionsCount: questions.length,
      position,
      userGpa,
      userToeic
    });

    // OpenAI API 호출
    const feedbacks = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      console.log(`🔄 질문 ${i + 1}/${questions.length} 처리 중...`);

      const prompt = `당신은 취업 전문 컨설턴트입니다. 아래 자기소개서 질문과 답변을 상세히 첨삭해주세요.

**직무**: ${position}
**질문**: ${question.question}
**답변**: ${question.answer}

${userGpa ? `**학점**: ${userGpa}` : ''}
${userToeic ? `**토익**: ${userToeic}점` : ''}
${userCertificates && userCertificates.length > 0 ? `**자격증**: ${userCertificates.join(', ')}` : ''}

다음 형식의 JSON으로 응답해주세요:
{
  "questionNumber": ${i + 1},
  "question": "${question.question}",
  "answer": "${question.answer}",
  "userAnswer": "${question.answer}",
  "overallScore": 75,
  "overallSummary": "전반적인 평가...",
  "structureAnalysis": {
    "totalScore": 70,
    "logic": { "score": 75, "feedback": "..." },
    "consistency": { "score": 70, "feedback": "..." },
    "completeness": { "score": 65, "feedback": "..." },
    "suggestions": ["제안1", "제안2"]
  },
  "contentAnalysis": {
    "totalScore": 75,
    "specificity": { "score": 70, "feedback": "..." },
    "relevance": { "score": 80, "feedback": "..." },
    "differentiation": { "score": 75, "feedback": "..." },
    "strengths": ["강점1", "강점2"],
    "weaknesses": ["약점1", "약점2"]
  },
  "expressionAnalysis": {
    "totalScore": 80,
    "writing": { "score": 75, "feedback": "..." },
    "vocabulary": { "score": 80, "feedback": "..." },
    "readability": { "score": 85, "feedback": "..." },
    "improvements": ["개선사항1", "개선사항2"]
  },
  "jobFitAnalysis": {
    "totalScore": 70,
    "expertise": { "score": 65, "feedback": "..." },
    "passion": { "score": 75, "feedback": "..." },
    "growth": { "score": 70, "feedback": "..." }
  },
  "competitorComparison": {
    "specComparison": {
      "gpa": "평균과 비교...",
      "toeic": "평균과 비교...",
      "certificates": "평균과 비교..."
    },
    "activityComparison": {
      "quantity": "...",
      "quality": "...",
      "relevance": "..."
    },
    "summary": "전체 요약...",
    "missingElements": ["누락된 요소1", "누락된 요소2"],
    "recommendations": ["추천사항1", "추천사항2"]
  },
  "revisedVersion": "수정된 답변...",
  "keyImprovements": ["핵심 개선사항1", "핵심 개선사항2"]
}`;

      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: '당신은 전문 취업 컨설턴트입니다. 자기소개서를 상세히 분석하고 건설적인 피드백을 제공합니다. 반드시 유효한 JSON 형식으로 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      const content = response.choices[0].message.content || '{}';

      try {
        const feedback = JSON.parse(content);
        feedbacks.push(feedback);
      } catch (parseError) {
        console.error('JSON 파싱 실패:', content);
        feedbacks.push({
          questionNumber: i + 1,
          question: question.question,
          answer: question.answer,
          userAnswer: question.answer,
          overallScore: 70,
          overallSummary: '분석 중 오류가 발생했습니다.',
          error: true
        });
      }
    }

    // 평균 점수 계산
    const averageScore = Math.round(
      feedbacks.reduce((sum, f) => sum + (f.overallScore || 0), 0) / feedbacks.length
    );

    const report = {
      position,
      totalQuestions: questions.length,
      averageScore,
      questionFeedbacks: feedbacks,
      overallRecommendations: [
        '전반적으로 구체적인 경험과 성과를 더 추가하세요.',
        '직무와의 연관성을 더 명확하게 표현하세요.',
        '문장을 간결하게 다듬으세요.'
      ],
      createdAt: new Date().toISOString()
    };

    console.log('✅ 첨삭 완료:', {
      totalQuestions: report.totalQuestions,
      averageScore: report.averageScore
    });

    res.json(report);

  } catch (error: any) {
    console.error('❌ 첨삭 생성 실패:', error);
    res.status(500).json({
      error: '첨삭 생성 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

export default router;
