import {
  MotivationFields,
  ExperienceFields,
  StrengthFields,
  VisionFields,
  GrowthFields,
  FailureFields,
  TeamworkFields,
  ConflictFields,
} from '../types/fieldBasedCoverLetter';

// Vercel Serverless Function으로 OpenAI API 호출
async function callOpenAI(messages: any[], temperature = 0.7, max_tokens = 1500) {
  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: 'gpt-4o-mini',
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * LLM을 사용하여 필드 데이터로부터 전문적인 자소서 답변 생성
 */
export async function generateAnswerWithLLM(
  fieldType: string,
  fields: any,
  questionText: string,
  maxLength: number,
  referenceData?: string
): Promise<string> {
  try {
    // 필드 데이터를 구조화된 텍스트로 변환
    const fieldsSummary = Object.entries(fields)
      .filter(([_, value]) => value && String(value).trim())
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');

    if (!fieldsSummary.trim()) {
      return ''; // 입력된 필드가 없으면 빈 문자열 반환
    }

    const systemPrompt = `당신은 취업 자기소개서 작성 전문가입니다.
사용자가 입력한 필드 데이터를 바탕으로 전문적이고 설득력 있는 자소서 답변을 작성하세요.

중요 지침:
1. 입력된 필드 데이터의 핵심 내용을 모두 자연스럽게 포함하세요
2. STAR 기법 (Situation, Task, Action, Result)을 활용하여 구조화하세요
3. 구체적인 수치, 성과, 배운 점을 강조하세요
4. 자연스러운 한국어 문장으로 작성하세요
5. 필드를 단순 나열하지 말고, 스토리텔링으로 엮으세요
6. 최대 ${maxLength}자를 넘지 않도록 하세요
7. 레퍼런스 데이터가 제공되면 참고만 하되, 절대 그대로 복사하지 마세요
8. 진정성 있고 개인의 경험이 드러나도록 작성하세요

답변만 작성하고, 다른 설명은 붙이지 마세요.`;

    let userPrompt = `질문: ${questionText}\n\n입력된 필드 데이터:\n${fieldsSummary}`;

    if (referenceData) {
      userPrompt += `\n\n참고 데이터 (영감용, 절대 복사 금지):\n${referenceData}`;
    }

    const response = await callOpenAI([
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ], 0.8, 1500);

    const generatedAnswer = response.choices[0]?.message?.content?.trim() || '';

    // 최대 길이 체크
    if (generatedAnswer.length > maxLength) {
      // 길이 초과시 재생성 요청
      const truncateResponse = await callOpenAI([
        {
          role: 'system',
          content: `다음 자소서 답변을 ${maxLength}자 이내로 축약하세요. 핵심 내용은 유지하되, 불필요한 부분을 제거하세요. 답변만 작성하세요.`,
        },
        {
          role: 'user',
          content: generatedAnswer,
        },
      ], 0.7, 1000);

      return truncateResponse.choices[0]?.message?.content?.trim() || generatedAnswer.slice(0, maxLength);
    }

    return generatedAnswer;

  } catch (error: any) {
    console.error('LLM answer generation failed:', error);
    // 폴백: 필드 값을 간단히 연결
    return Object.values(fields)
      .filter((v) => v && String(v).trim())
      .join(' ');
  }
}

/**
 * 필드 타입별 특화된 프롬프트로 답변 생성
 */
export async function generateTypedAnswerWithLLM(
  fieldType: 'motivation' | 'experience' | 'strength' | 'vision' | 'growth' | 'failure' | 'teamwork' | 'conflict',
  fields: MotivationFields | ExperienceFields | StrengthFields | VisionFields | GrowthFields | FailureFields | TeamworkFields | ConflictFields,
  questionText: string,
  maxLength: number,
  referenceData?: string
): Promise<string> {
  const typeSpecificGuidance: Record<string, string> = {
    motivation: '지원 동기는 회사에 대한 이해, 개인의 목표, 그리고 회사와의 적합성을 보여주어야 합니다. 구체적인 계기와 진정성이 느껴지도록 작성하세요.',
    experience: '프로젝트 경험은 상황, 본인의 역할, 해결 과정, 구체적인 성과를 포함해야 합니다. 기술적 깊이와 문제해결 능력을 강조하세요.',
    strength: '강점은 구체적인 사례로 입증되어야 합니다. 추상적인 표현을 피하고, 실제 상황에서 어떻게 발휘되었는지 보여주세요.',
    vision: '포부는 단기/중기/장기 목표가 연결되어야 하며, 회사에서 어떻게 기여할지 구체적으로 제시하세요.',
    growth: '성장 과정은 변화의 계기, 노력, 결과가 드러나야 합니다. 현재의 본인에게 어떤 영향을 미쳤는지 강조하세요.',
    failure: '실패 경험은 솔직함, 극복 과정, 배움이 중요합니다. 실패를 통해 성장한 모습을 보여주세요.',
    teamwork: '협업 경험은 소통 능력, 역할 수행, 팀에 대한 기여를 보여줘야 합니다. 구체적인 협업 방법을 설명하세요.',
    conflict: '갈등 해결은 양측 입장에 대한 이해, 합리적 해결 과정, 긍정적 결과를 보여줘야 합니다. 리더십과 소통 능력을 강조하세요.',
  };

  const guidance = typeSpecificGuidance[fieldType] || '';

  try {
    const fieldsSummary = Object.entries(fields)
      .filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : String(value).trim()))
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `- ${key}: ${value.join(', ')}`;
        }
        return `- ${key}: ${value}`;
      })
      .join('\n');

    if (!fieldsSummary.trim()) {
      return '';
    }

    const targetMin = Math.floor(maxLength * 0.85);
    const targetMax = maxLength;

    const systemPrompt = `당신은 취업 자기소개서 작성 전문가입니다.

질문 유형: ${fieldType}
${guidance}

중요 지침:
1. 입력된 필드 데이터를 모두 자연스럽게 활용하세요
2. 스토리텔링으로 설득력 있게 작성하세요
3. 구체적인 수치와 성과를 강조하세요
4. **매우 중요**: 답변 길이는 반드시 ${targetMin}자 ~ ${targetMax}자 사이로 작성하세요
5. 글자 수를 최대한 채우되, ${maxLength}자를 절대 초과하지 마세요
6. 레퍼런스는 참고만 하고 절대 복사하지 마세요
7. 진정성과 개인의 경험이 드러나도록 하세요

답변만 작성하세요. 다른 설명이나 메타 정보는 포함하지 마세요.`;

    let userPrompt = `질문: ${questionText}\n\n입력된 필드 데이터:\n${fieldsSummary}`;

    if (referenceData) {
      userPrompt += `\n\n참고 데이터 (영감용):\n${referenceData}`;
    }

    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.8, 1500);

    let generatedAnswer = response.choices[0]?.message?.content?.trim() || '';

    // 길이 초과시 축약
    if (generatedAnswer.length > maxLength) {
      const truncateResponse = await callOpenAI([
        {
          role: 'system',
          content: `다음 답변을 ${maxLength}자 이내로 축약하세요. 핵심 내용은 유지하되, 불필요한 부분을 제거하세요.`,
        },
        { role: 'user', content: generatedAnswer },
      ], 0.7);

      generatedAnswer = truncateResponse.choices[0]?.message?.content?.trim() || generatedAnswer.slice(0, maxLength);
    }

    return generatedAnswer;

  } catch (error: any) {
    console.error('Typed LLM answer generation failed:', error);
    return Object.values(fields)
      .filter((v) => v && String(v).trim())
      .join(' ');
  }
}
