// Vercel Serverless Function을 통한 OpenAI API 호출 유틸리티

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Vercel Serverless Function을 통해 OpenAI API 호출
 */
export async function callOpenAI(
  messages: OpenAIMessage[],
  temperature = 0.7,
  max_tokens = 1500
): Promise<OpenAIResponse> {
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
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`OpenAI API Error: ${response.statusText} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * OpenAI SDK와 호환되는 인터페이스를 제공하는 래퍼 객체
 * 기존 코드를 최소한으로 수정하기 위한 호환성 레이어
 */
export const openai = {
  chat: {
    completions: {
      create: async (params: {
        model?: string;
        messages: OpenAIMessage[];
        temperature?: number;
        max_tokens?: number;
      }) => {
        return callOpenAI(
          params.messages,
          params.temperature || 0.7,
          params.max_tokens || 1500
        );
      },
    },
  },
};
