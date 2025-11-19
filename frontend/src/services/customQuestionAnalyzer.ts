import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder: string;
  required: boolean;
}

export interface CustomQuestionAnalysis {
  questionText: string;
  suggestedFields: CustomFieldDefinition[];
  explanation: string;
}

/**
 * LLM을 사용하여 사용자 정의 질문을 분석하고 필요한 필드를 추출
 */
export async function analyzeCustomQuestion(questionText: string): Promise<CustomQuestionAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 자기소개서 질문 분석 전문가입니다. 사용자가 입력한 자소서 질문을 분석하여,
답변 작성에 필요한 핵심 필드들을 추출하세요.

각 필드는 다음 정보를 포함해야 합니다:
- key: 필드의 고유 키 (영문, camelCase)
- label: 사용자에게 보여줄 한글 레이블
- type: 'text' (짧은 입력) 또는 'textarea' (긴 입력)
- placeholder: 입력 예시
- required: 필수 여부 (true/false)

필드는 질문의 핵심 요소를 파악할 수 있도록 구체적이고 실용적으로 구성하세요.
일반적으로 5-10개의 필드가 적절합니다.

응답은 반드시 다음 JSON 형식으로만 답변하세요:
{
  "suggestedFields": [
    {
      "key": "fieldKey",
      "label": "필드 레이블",
      "type": "text",
      "placeholder": "예시 입력",
      "required": true
    }
  ],
  "explanation": "이 질문에 대한 답변 작성 가이드 (1-2문장)"
}`
        },
        {
          role: 'user',
          content: `다음 자소서 질문을 분석해주세요:\n\n"${questionText}"`
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM 응답이 비어있습니다.');
    }

    const parsed = JSON.parse(content);

    return {
      questionText,
      suggestedFields: parsed.suggestedFields,
      explanation: parsed.explanation,
    };

  } catch (error: any) {
    console.error('Custom question analysis failed:', error);

    // 폴백: 기본 필드 구조 반환
    return {
      questionText,
      suggestedFields: [
        {
          key: 'situation',
          label: '상황',
          type: 'textarea',
          placeholder: '어떤 상황이었나요?',
          required: true,
        },
        {
          key: 'action',
          label: '행동',
          type: 'textarea',
          placeholder: '무엇을 했나요?',
          required: true,
        },
        {
          key: 'result',
          label: '결과',
          type: 'textarea',
          placeholder: '어떤 결과를 얻었나요?',
          required: true,
        },
        {
          key: 'lesson',
          label: '배운 점',
          type: 'text',
          placeholder: '이 경험을 통해 무엇을 배웠나요?',
          required: false,
        },
      ],
      explanation: 'STAR 기법을 활용하여 상황, 행동, 결과, 배운 점을 구체적으로 작성하세요.',
    };
  }
}

/**
 * 커스텀 필드로부터 답변 생성
 */
export function generateAnswerFromCustomFields(fields: Record<string, string>): string {
  const parts: string[] = [];

  Object.entries(fields).forEach(([key, value]) => {
    if (value && value.trim()) {
      parts.push(value.trim());
    }
  });

  return parts.join(' ');
}
