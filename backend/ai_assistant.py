import os
import json
import re
from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
import pystache
from dataclasses import dataclass, asdict

@dataclass
class ParsedInfo:
    name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    github: Optional[str] = None
    githubUrl: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    experiences: List[Dict] = None
    projects: List[Dict] = None
    skills: List[Dict] = None
    education: List[Dict] = None
    certifications: List[str] = None
    languages: List[Dict] = None
    behance: Optional[str] = None
    role: Optional[str] = None
    tools: Optional[str] = None

    def __post_init__(self):
        if self.experiences is None:
            self.experiences = []
        if self.projects is None:
            self.projects = []
        if self.skills is None:
            self.skills = []
        if self.education is None:
            self.education = []
        if self.certifications is None:
            self.certifications = []
        if self.languages is None:
            self.languages = []

class AIPortfolioAssistant:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "your-openai-api-key")
        )
    
    async def extract_template_variables(self, template: str) -> List[str]:
        """템플릿에서 변수들을 추출"""
        variables = re.findall(r'\{\{(\w+)\}\}', template)
        return list(set(variables))
    
    async def parse_raw_text(self, raw_text: str, template_variables: List[str]) -> ParsedInfo:
        """자유형식 텍스트에서 구조화된 정보 추출"""
        
        system_prompt = f"""
당신은 포트폴리오 작성을 도와주는 AI 어시스턴트입니다.
사용자가 제공한 자유형식의 텍스트에서 다음 정보들을 추출해주세요:

필요한 정보: {', '.join(template_variables)}

추출된 정보를 JSON 형태로 반환해주세요. 
경력사항, 프로젝트, 스킬 등은 배열 형태로 구조화해주세요.

예시 형식:
{{
    "name": "이름",
    "title": "직책",
    "email": "이메일",
    "summary": "자기소개",
    "experiences": [
        {{
            "company": "회사명",
            "position": "직책",
            "startDate": "시작일",
            "endDate": "종료일",
            "description": "업무 설명",
            "achievements": ["성과1", "성과2"],
            "technologies": ["기술1", "기술2"]
        }}
    ],
    "projects": [
        {{
            "name": "프로젝트명",
            "description": "설명",
            "technologies": ["기술1", "기술2"],
            "highlights": ["주요성과1", "주요성과2"],
            "url": "라이브 URL",
            "githubUrl": "GitHub URL"
        }}
    ],
    "skills": [
        {{
            "category": "카테고리",
            "items": ["기술1", "기술2"],
            "proficiency": 5
        }}
    ]
}}

정보가 명확하지 않거나 없으면 null 또는 빈 배열로 설정해주세요.
"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"다음 텍스트에서 정보를 추출해주세요:\n\n{raw_text}"}
                ],
                temperature=0.3
            )
            
            extracted_json = response.choices[0].message.content
            
            # JSON 추출 (코드 블록 제거)
            if "```json" in extracted_json:
                extracted_json = re.search(r'```json\n(.*?)\n```', extracted_json, re.DOTALL).group(1)
            elif "```" in extracted_json:
                extracted_json = re.search(r'```\n(.*?)\n```', extracted_json, re.DOTALL).group(1)
            
            parsed_data = json.loads(extracted_json)
            
            # 알려진 필드만 ParsedInfo에 전달
            known_fields = {
                'name', 'title', 'email', 'phone', 'github', 'githubUrl', 
                'linkedin', 'website', 'summary', 'location', 'experiences', 
                'projects', 'skills', 'education', 'certifications', 'languages',
                'behance', 'role', 'tools'
            }
            
            filtered_data = {k: v for k, v in parsed_data.items() if k in known_fields}
            return ParsedInfo(**filtered_data)
            
        except Exception as e:
            print(f"텍스트 파싱 오류: {e}")
            return ParsedInfo()
    
    async def identify_missing_info(self, parsed_info: ParsedInfo, template_variables: List[str]) -> List[str]:
        """부족한 정보 식별"""
        missing = []
        parsed_dict = asdict(parsed_info)
        
        for var in template_variables:
            if var not in parsed_dict or not parsed_dict[var]:
                missing.append(var)
            elif isinstance(parsed_dict[var], list) and len(parsed_dict[var]) == 0:
                missing.append(var)
        
        return missing
    
    async def generate_questions(self, missing_info: List[str], context: Dict[str, Any]) -> List[Dict[str, str]]:
        """부족한 정보에 대한 질문 생성"""
        if not missing_info:
            return []
        
        system_prompt = """
당신은 전문적인 포트폴리오 작성을 도와주는 친근한 AI 커리어 어드바이저입니다.
사용자가 가장 매력적이고 경쟁력 있는 포트폴리오를 완성할 수 있도록 도와주는 것이 목표입니다.

당신의 역할:
1. 부족한 정보를 파악하고 전략적으로 중요한 순서대로 질문
2. 사용자의 강점을 부각시킬 수 있는 정보를 우선적으로 수집
3. 구체적이고 측정 가능한 성과 데이터 확보
4. 경력/프로젝트의 임팩트와 기술적 깊이 파악
5. 채용담당자가 주목할 만한 차별화 포인트 발굴

질문 원칙:
- 한 번에 하나씩, 구체적으로 질문
- 왜 이 정보가 중요한지 간단히 설명 포함
- 답변하기 쉽도록 구체적인 예시나 가이드 제공
- 성과는 수치화할 수 있도록 유도

질문 형식 (JSON 배열):
[
    {
        "field": "필드명",
        "question": "질문 내용 (중요성 설명 + 구체적 질문 + 예시)",
        "type": "text|select|number",
        "options": ["선택지1", "선택지2"] // select 타입인 경우만
    }
]

톤앤매너: 전문적이면서도 친근하고 격려하는 톤
"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"다음 정보가 부족합니다. 적절한 질문을 생성해주세요:\n{', '.join(missing_info)}\n\n현재 수집된 정보:\n{json.dumps(context, ensure_ascii=False, indent=2)}"}
                ],
                temperature=0.7
            )
            
            questions_json = response.choices[0].message.content
            
            if "```json" in questions_json:
                questions_json = re.search(r'```json\n(.*?)\n```', questions_json, re.DOTALL).group(1)
            elif "```" in questions_json:
                questions_json = re.search(r'```\n(.*?)\n```', questions_json, re.DOTALL).group(1)
            
            return json.loads(questions_json)
            
        except Exception as e:
            print(f"질문 생성 오류: {e}")
            return []
    
    async def process_user_answer(self, question: Dict[str, str], answer: str, current_data: ParsedInfo) -> ParsedInfo:
        """사용자 답변을 처리하여 데이터 업데이트"""
        
        system_prompt = f"""
당신은 포트폴리오 정보를 정리하는 AI입니다.
사용자의 답변을 받아서 기존 데이터에 적절히 통합해주세요.

질문: {question.get('question', '')}
필드: {question.get('field', '')}
사용자 답변: {answer}

현재 데이터를 업데이트한 전체 JSON을 반환해주세요.
반드시 JSON 형태로만 응답하고, 다른 설명은 포함하지 마세요.
"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"현재 데이터:\n{json.dumps(asdict(current_data), ensure_ascii=False, indent=2)}\n\n답변: {answer}"}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            updated_json = response.choices[0].message.content
            print(f"OpenAI 응답: {updated_json}")
            
            if not updated_json or updated_json.strip() == "":
                print("OpenAI 응답이 비어있습니다")
                return current_data
            
            # JSON 추출
            if "```json" in updated_json:
                match = re.search(r'```json\n(.*?)\n```', updated_json, re.DOTALL)
                if match:
                    updated_json = match.group(1)
            elif "```" in updated_json:
                match = re.search(r'```\n(.*?)\n```', updated_json, re.DOTALL)
                if match:
                    updated_json = match.group(1)
            
            # JSON 파싱
            updated_data = json.loads(updated_json.strip())
            
            # 알려진 필드만 필터링
            known_fields = {
                'name', 'title', 'email', 'phone', 'github', 'githubUrl', 
                'linkedin', 'website', 'summary', 'location', 'experiences', 
                'projects', 'skills', 'education', 'certifications', 'languages',
                'behance', 'role', 'tools'
            }
            
            filtered_data = {k: v for k, v in updated_data.items() if k in known_fields}
            return ParsedInfo(**filtered_data)
            
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {e}")
            print(f"받은 응답: {updated_json}")
            
            # 간단한 필드 업데이트 fallback
            field_name = question.get('field', '')
            if field_name and hasattr(current_data, field_name):
                setattr(current_data, field_name, answer)
            
            return current_data
            
        except Exception as e:
            print(f"답변 처리 오류: {e}")
            return current_data
    
    async def generate_portfolio(self, template: str, data: ParsedInfo) -> str:
        """최종 포트폴리오 생성"""
        try:
            # Pystache를 사용하여 템플릿 렌더링
            data_dict = asdict(data)
            
            # None 값들을 빈 문자열로 처리
            def clean_data(obj):
                if isinstance(obj, dict):
                    return {k: clean_data(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [clean_data(item) for item in obj]
                elif obj is None:
                    return ""
                else:
                    return obj
            
            clean_data_dict = clean_data(data_dict)
            
            # 템플릿 렌더링
            renderer = pystache.Renderer()
            rendered_portfolio = renderer.render(template, clean_data_dict)
            
            return rendered_portfolio
            
        except Exception as e:
            print(f"포트폴리오 생성 오류: {e}")
            return template
    
    async def enhance_portfolio(self, portfolio_content: str) -> str:
        """포트폴리오 내용 개선"""
        
        system_prompt = """
당신은 실리콘밸리 테크 기업과 국내 대기업의 채용 프로세스를 잘 아는 전문 포트폴리오 컨설턴트입니다.
채용담당자가 15초 안에 후보자의 가치를 파악할 수 있도록 포트폴리오를 최적화하는 것이 목표입니다.

개선 전략:
1. **임팩트 중심 서술**: 모든 경험을 비즈니스 임팩트와 연결
2. **수치화된 성과**: 구체적인 숫자, 증가율, 규모 등으로 성과 강조
3. **키워드 최적화**: 해당 직무의 핵심 키워드를 자연스럽게 배치
4. **차별화 포인트**: 경쟁자 대비 독특한 강점 부각
5. **기술적 깊이**: 단순 나열이 아닌 기술 활용의 맥락과 깊이 표현
6. **스토리텔링**: 성장 과정과 문제 해결 과정을 논리적으로 연결

표현 개선 원칙:
- 수동적 표현 → 능동적 리더십 표현
- 일반적 표현 → 구체적이고 전문적인 표현  
- 작업 나열 → 문제 정의 → 솔루션 → 결과 순서로 구조화
- 기술 스택 → 기술을 통해 해결한 문제와 달성한 성과

마크다운 최적화:
- 스캔하기 쉬운 구조와 시각적 계층
- 핵심 정보가 눈에 띄는 배치
- 적절한 강조와 구분

원본의 사실과 구조는 절대 변경하지 말고, 표현과 구성만 최적화해주세요.
"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"다음 포트폴리오를 개선해주세요:\n\n{portfolio_content}"}
                ],
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"포트폴리오 개선 오류: {e}")
            return portfolio_content