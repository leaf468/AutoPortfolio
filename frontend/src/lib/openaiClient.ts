/**
 * OpenAI API 클라이언트
 * 프로덕션에서는 Vercel API 프록시를 통해 호출하고,
 * 개발 환경에서는 직접 호출합니다.
 */

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model?: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

interface ChatCompletionChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini';

// API 프록시 URL 결정
const getApiUrl = () => {
  // 프로덕션 환경
  if (process.env.NODE_ENV === 'production') {
    return '/api/openai';
  }
  // 개발 환경 - 직접 OpenAI API 호출
  return 'https://api.openai.com/v1/chat/completions';
};

const isDevelopment = process.env.NODE_ENV !== 'production';
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

/**
 * OpenAI Chat Completion API 호출
 */
export async function createChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const url = getApiUrl();

  const body = {
    model: request.model || OPENAI_MODEL,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.max_tokens ?? 2000,
    ...(request.response_format && { response_format: request.response_format }),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 개발 환경에서는 직접 API 키 사용
  if (isDevelopment && url.includes('openai.com')) {
    headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 간편하게 텍스트 응답만 가져오는 함수
 */
export async function getCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    json?: boolean;
  }
): Promise<string> {
  const response = await createChatCompletion({
    model: options?.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: options?.temperature,
    max_tokens: options?.max_tokens,
    response_format: options?.json ? { type: 'json_object' } : undefined,
  });

  return response.choices[0]?.message?.content || '';
}

export { OPENAI_MODEL };
