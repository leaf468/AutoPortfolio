from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import json
import os
from datetime import datetime
import markdown
from pathlib import Path
import io
from jinja2 import Environment, FileSystemLoader
import uuid
from dotenv import load_dotenv
from ai_assistant import AIPortfolioAssistant, ParsedInfo

load_dotenv()

app = FastAPI(title="Careeroad Portfolio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInfo(BaseModel):
    name: str
    title: str
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    summary: str
    location: Optional[str] = None

class Experience(BaseModel):
    company: str
    position: str
    start_date: str
    end_date: Optional[str] = "Present"
    description: str
    achievements: List[str] = []
    technologies: List[str] = []

class Project(BaseModel):
    name: str
    description: str
    url: Optional[str] = None
    github_url: Optional[str] = None
    technologies: List[str]
    highlights: List[str]
    image_url: Optional[str] = None
    date: Optional[str] = None

class Education(BaseModel):
    institution: str
    degree: str
    field: str
    start_date: str
    end_date: Optional[str] = None
    gpa: Optional[float] = None
    achievements: List[str] = []

class Skill(BaseModel):
    category: str
    items: List[str]
    proficiency: Optional[int] = Field(None, ge=1, le=5)

class PortfolioRequest(BaseModel):
    user_info: UserInfo
    experiences: List[Experience] = []
    projects: List[Project] = []
    education: List[Education] = []
    skills: List[Skill] = []
    certifications: List[str] = []
    languages: List[Dict[str, str]] = []
    format: str = Field(default="markdown", pattern="^(markdown|html|pdf)$")
    template: str = Field(default="modern")
    theme: Optional[str] = "light"

class QuestionPayload(BaseModel):
    question: str
    reason: str
    options: Optional[List[str]] = None
    field_name: str

class AssistantResponse(BaseModel):
    action: str
    message: str
    payload: Optional[Dict[str, Any]] = None
    missing_fields: List[str] = []
    stop: bool = False

TEMPLATES_DIR = Path("../templates")
TEMP_DIR = Path("./temp")
TEMP_DIR.mkdir(exist_ok=True)

# AI 어시스턴트 인스턴스
ai_assistant = AIPortfolioAssistant()

def load_template(template_name: str, format: str) -> str:
    template_path = TEMPLATES_DIR / f"{template_name}.{format}.jinja2"
    if not template_path.exists():
        template_path = TEMPLATES_DIR / f"default.{format}.jinja2"
    
    with open(template_path, 'r', encoding='utf-8') as f:
        return f.read()

@app.get("/")
async def root():
    return {"message": "Careeroad Portfolio API", "version": "1.0.0"}

@app.get("/api/test-openai")
async def test_openai():
    """OpenAI API 연결 테스트"""
    try:
        # 간단한 테스트 요청
        response = await ai_assistant.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": "Hello, just respond with 'API connected successfully'"}
            ],
            temperature=0,
            max_tokens=50
        )
        
        result = response.choices[0].message.content
        return {
            "status": "success", 
            "message": "OpenAI API 연결 성공",
            "response": result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"OpenAI API 연결 실패: {str(e)}"
        }

@app.post("/api/analyze", response_model=AssistantResponse)
async def analyze_portfolio(data: Dict[str, Any]):
    missing_fields = []
    
    if "user_info" not in data or not data["user_info"]:
        missing_fields.append("user_info")
    else:
        user_info = data["user_info"]
        required_user_fields = ["name", "title", "summary"]
        for field in required_user_fields:
            if field not in user_info or not user_info[field]:
                missing_fields.append(f"user_info.{field}")
    
    if not data.get("projects") and not data.get("experiences"):
        missing_fields.append("projects_or_experiences")
    
    if missing_fields:
        first_missing = missing_fields[0]
        field_map = {
            "user_info.name": ("이름을 입력해주세요", "포트폴리오 상단에 표시될 이름입니다"),
            "user_info.title": ("직무/직책을 입력해주세요", "예: Full Stack Developer, UI/UX Designer"),
            "user_info.summary": ("자기소개를 작성해주세요", "2-3문장으로 핵심 역량과 목표를 설명해주세요"),
            "projects_or_experiences": ("프로젝트나 경력사항을 추가해주세요", "포트폴리오의 핵심 콘텐츠입니다")
        }
        
        question, reason = field_map.get(first_missing, 
                                         (f"{first_missing}를 입력해주세요", "포트폴리오 완성을 위해 필요합니다"))
        
        return AssistantResponse(
            action="ask_question",
            message=question,
            payload={
                "question": question,
                "reason": reason,
                "field_name": first_missing
            },
            missing_fields=missing_fields,
            stop=False
        )
    
    return AssistantResponse(
        action="preview_markdown",
        message="포트폴리오 정보가 충분합니다. 미리보기를 생성할 준비가 되었습니다.",
        payload={"ready": True},
        missing_fields=[],
        stop=False
    )

@app.post("/api/generate", response_model=Dict[str, Any])
async def generate_portfolio(request: PortfolioRequest, background_tasks: BackgroundTasks):
    try:
        portfolio_id = str(uuid.uuid4())
        
        env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
        
        if request.format == "markdown":
            content = generate_markdown(request)
            file_path = TEMP_DIR / f"{portfolio_id}.md"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                "portfolio_id": portfolio_id,
                "format": "markdown",
                "content": content,
                "download_url": f"/api/download/{portfolio_id}",
                "message": "마크다운 포트폴리오가 생성되었습니다"
            }
        
        elif request.format == "html":
            html_content = generate_html(request)
            file_path = TEMP_DIR / f"{portfolio_id}.html"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            return {
                "portfolio_id": portfolio_id,
                "format": "html",
                "preview_url": f"/api/preview/{portfolio_id}",
                "download_url": f"/api/download/{portfolio_id}",
                "message": "HTML 포트폴리오가 생성되었습니다"
            }
        
        elif request.format == "pdf":
            pdf_content = await generate_pdf(request)
            file_path = TEMP_DIR / f"{portfolio_id}.pdf"
            with open(file_path, 'wb') as f:
                f.write(pdf_content)
            
            return {
                "portfolio_id": portfolio_id,
                "format": "pdf",
                "download_url": f"/api/download/{portfolio_id}",
                "message": "PDF 포트폴리오가 생성되었습니다"
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_markdown(request: PortfolioRequest) -> str:
    md_lines = []
    
    md_lines.append(f"# {request.user_info.name}")
    md_lines.append(f"## {request.user_info.title}")
    md_lines.append("")
    
    if request.user_info.email or request.user_info.phone:
        contact_items = []
        if request.user_info.email:
            contact_items.append(f"📧 {request.user_info.email}")
        if request.user_info.phone:
            contact_items.append(f"📱 {request.user_info.phone}")
        if request.user_info.linkedin:
            contact_items.append(f"🔗 [LinkedIn]({request.user_info.linkedin})")
        if request.user_info.github:
            contact_items.append(f"🐙 [GitHub]({request.user_info.github})")
        md_lines.append(" | ".join(contact_items))
        md_lines.append("")
    
    md_lines.append("## 소개")
    md_lines.append(request.user_info.summary)
    md_lines.append("")
    
    if request.experiences:
        md_lines.append("## 경력사항")
        for exp in request.experiences:
            md_lines.append(f"### {exp.company}")
            md_lines.append(f"**{exp.position}** | {exp.start_date} - {exp.end_date}")
            md_lines.append("")
            md_lines.append(exp.description)
            if exp.achievements:
                md_lines.append("")
                for achievement in exp.achievements:
                    md_lines.append(f"- {achievement}")
            if exp.technologies:
                md_lines.append("")
                md_lines.append(f"**기술스택:** {', '.join(exp.technologies)}")
            md_lines.append("")
    
    if request.projects:
        md_lines.append("## 프로젝트")
        for project in request.projects:
            md_lines.append(f"### {project.name}")
            if project.date:
                md_lines.append(f"*{project.date}*")
            md_lines.append("")
            md_lines.append(project.description)
            md_lines.append("")
            
            if project.highlights:
                md_lines.append("**주요 성과:**")
                for highlight in project.highlights:
                    md_lines.append(f"- {highlight}")
                md_lines.append("")
            
            if project.technologies:
                md_lines.append(f"**기술스택:** {', '.join(project.technologies)}")
                md_lines.append("")
            
            links = []
            if project.url:
                links.append(f"[🔗 Live Demo]({project.url})")
            if project.github_url:
                links.append(f"[📦 GitHub]({project.github_url})")
            if links:
                md_lines.append(" | ".join(links))
                md_lines.append("")
    
    if request.skills:
        md_lines.append("## 기술 스택")
        for skill in request.skills:
            md_lines.append(f"### {skill.category}")
            md_lines.append(", ".join(skill.items))
            md_lines.append("")
    
    if request.education:
        md_lines.append("## 학력")
        for edu in request.education:
            md_lines.append(f"### {edu.institution}")
            md_lines.append(f"**{edu.degree}** in {edu.field}")
            md_lines.append(f"{edu.start_date} - {edu.end_date or 'Present'}")
            if edu.gpa:
                md_lines.append(f"GPA: {edu.gpa}")
            if edu.achievements:
                for achievement in edu.achievements:
                    md_lines.append(f"- {achievement}")
            md_lines.append("")
    
    return "\n".join(md_lines)

def generate_html(request: PortfolioRequest) -> str:
    markdown_content = generate_markdown(request)
    html_body = markdown.markdown(markdown_content, extensions=['extra', 'codehilite'])
    
    html_template = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{request.user_info.name} - Portfolio</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }}
        
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }}
        
        .header h2 {{
            font-size: 1.5rem;
            font-weight: 300;
            opacity: 0.95;
        }}
        
        .contact {{
            margin-top: 1.5rem;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 1rem;
        }}
        
        .contact a {{
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            transition: background 0.3s;
        }}
        
        .contact a:hover {{
            background: rgba(255,255,255,0.3);
        }}
        
        .content {{
            padding: 3rem;
        }}
        
        h2 {{
            color: #667eea;
            margin-top: 2rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f0f0f0;
        }}
        
        h3 {{
            color: #764ba2;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }}
        
        ul {{
            margin-left: 1.5rem;
            margin-top: 0.5rem;
        }}
        
        li {{
            margin-bottom: 0.5rem;
        }}
        
        .tech-stack {{
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }}
        
        .tech-item {{
            background: #f0f0f0;
            padding: 0.25rem 0.75rem;
            border-radius: 15px;
            font-size: 0.9rem;
        }}
        
        .project-links {{
            margin-top: 1rem;
        }}
        
        .project-links a {{
            color: #667eea;
            text-decoration: none;
            margin-right: 1rem;
            padding: 0.5rem 1rem;
            border: 2px solid #667eea;
            border-radius: 20px;
            display: inline-block;
            transition: all 0.3s;
        }}
        
        .project-links a:hover {{
            background: #667eea;
            color: white;
        }}
        
        @media (max-width: 768px) {{
            body {{
                padding: 1rem;
            }}
            
            .header {{
                padding: 2rem;
            }}
            
            .header h1 {{
                font-size: 2rem;
            }}
            
            .content {{
                padding: 2rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{request.user_info.name}</h1>
            <h2>{request.user_info.title}</h2>
            <div class="contact">
                {f'<a href="mailto:{request.user_info.email}">📧 {request.user_info.email}</a>' if request.user_info.email else ''}
                {f'<a href="tel:{request.user_info.phone}">📱 {request.user_info.phone}</a>' if request.user_info.phone else ''}
                {f'<a href="{request.user_info.linkedin}" target="_blank">🔗 LinkedIn</a>' if request.user_info.linkedin else ''}
                {f'<a href="{request.user_info.github}" target="_blank">🐙 GitHub</a>' if request.user_info.github else ''}
            </div>
        </div>
        <div class="content">
            {html_body}
        </div>
    </div>
</body>
</html>"""
    
    return html_template

async def generate_pdf(request: PortfolioRequest) -> bytes:
    from weasyprint import HTML
    
    html_content = generate_html(request)
    pdf = HTML(string=html_content).write_pdf()
    
    return pdf

@app.get("/api/download/{portfolio_id}")
async def download_portfolio(portfolio_id: str):
    for ext in ['.md', '.html', '.pdf']:
        file_path = TEMP_DIR / f"{portfolio_id}{ext}"
        if file_path.exists():
            media_type = {
                '.md': 'text/markdown',
                '.html': 'text/html',
                '.pdf': 'application/pdf'
            }[ext]
            
            return FileResponse(
                path=file_path,
                media_type=media_type,
                filename=f"portfolio_{portfolio_id}{ext}"
            )
    
    raise HTTPException(status_code=404, detail="Portfolio not found")

@app.get("/api/preview/{portfolio_id}")
async def preview_portfolio(portfolio_id: str):
    html_path = TEMP_DIR / f"{portfolio_id}.html"
    if html_path.exists():
        with open(html_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    raise HTTPException(status_code=404, detail="Portfolio not found")

@app.get("/api/templates")
async def list_templates():
    templates = [
        {
            "id": "modern",
            "name": "Modern",
            "description": "깔끔하고 현대적인 디자인",
            "preview": "/api/templates/modern/preview"
        },
        {
            "id": "minimal",
            "name": "Minimal",
            "description": "미니멀한 디자인",
            "preview": "/api/templates/minimal/preview"
        },
        {
            "id": "creative",
            "name": "Creative",
            "description": "창의적이고 독특한 디자인",
            "preview": "/api/templates/creative/preview"
        }
    ]
    return {"templates": templates}

# 새로운 AI 기반 엔드포인트들

@app.post("/api/parse-text")
async def parse_raw_text(request: Dict[str, Any]):
    """자유형식 텍스트에서 정보 추출"""
    try:
        template = request.get("template", "")
        raw_text = request.get("rawText", "")
        
        if not template or not raw_text:
            raise HTTPException(status_code=400, detail="Template and rawText are required")
        
        # 템플릿에서 변수 추출
        template_variables = await ai_assistant.extract_template_variables(template)
        
        # 텍스트에서 정보 추출
        parsed_info = await ai_assistant.parse_raw_text(raw_text, template_variables)
        
        # 부족한 정보 식별
        missing_info = await ai_assistant.identify_missing_info(parsed_info, template_variables)
        
        return {
            "success": True,
            "parsed_data": parsed_info.__dict__,
            "missing_fields": missing_info,
            "template_variables": template_variables
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-questions")
async def generate_questions(request: Dict[str, Any]):
    """부족한 정보에 대한 질문 생성"""
    try:
        missing_info = request.get("missing_fields", [])
        context = request.get("context", {})
        
        if not missing_info:
            return {
                "questions": [],
                "is_complete": True
            }
        
        questions = await ai_assistant.generate_questions(missing_info, context)
        
        return {
            "questions": questions,
            "is_complete": False
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-answer")
async def process_user_answer(request: Dict[str, Any]):
    """사용자 답변 처리"""
    try:
        question = request.get("question", {})
        answer = request.get("answer", "")
        current_data_dict = request.get("current_data", {})
        
        # ParsedInfo 객체로 변환
        current_data = ParsedInfo(**current_data_dict)
        
        # 답변 처리
        updated_data = await ai_assistant.process_user_answer(question, answer, current_data)
        
        return {
            "success": True,
            "updated_data": updated_data.__dict__
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-from-template")
async def generate_from_template(request: Dict[str, Any]):
    """템플릿과 데이터로 포트폴리오 생성"""
    try:
        template = request.get("template", "")
        data_dict = request.get("data", {})
        
        if not template:
            raise HTTPException(status_code=400, detail="Template is required")
        
        # ParsedInfo 객체로 변환
        parsed_data = ParsedInfo(**data_dict)
        
        # 포트폴리오 생성
        portfolio_content = await ai_assistant.generate_portfolio(template, parsed_data)
        
        # 내용 개선
        enhanced_content = await ai_assistant.enhance_portfolio(portfolio_content)
        
        # 파일 저장
        portfolio_id = str(uuid.uuid4())
        
        # 마크다운 파일 저장
        md_path = TEMP_DIR / f"{portfolio_id}.md"
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(enhanced_content)
        
        # HTML 파일도 생성
        html_content = generate_html_from_markdown(enhanced_content, parsed_data)
        html_path = TEMP_DIR / f"{portfolio_id}.html"
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return {
            "portfolio_id": portfolio_id,
            "format": "markdown",
            "content": enhanced_content,
            "download_url": f"/api/download/{portfolio_id}",
            "preview_url": f"/api/preview/{portfolio_id}",
            "message": "AI 포트폴리오가 성공적으로 생성되었습니다!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_html_from_markdown(markdown_content: str, data: ParsedInfo) -> str:
    """마크다운을 HTML로 변환"""
    html_body = markdown.markdown(markdown_content, extensions=['extra', 'codehilite'])
    
    html_template = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{data.name or 'Portfolio'} - Portfolio</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }}
        
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }}
        
        .header h2 {{
            font-size: 1.5rem;
            font-weight: 300;
            opacity: 0.95;
        }}
        
        .content {{
            padding: 3rem;
        }}
        
        h2 {{
            color: #667eea;
            margin-top: 2rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f0f0f0;
        }}
        
        h3 {{
            color: #764ba2;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }}
        
        ul {{
            margin-left: 1.5rem;
            margin-top: 0.5rem;
        }}
        
        li {{
            margin-bottom: 0.5rem;
        }}
        
        @media (max-width: 768px) {{
            body {{
                padding: 1rem;
            }}
            
            .header {{
                padding: 2rem;
            }}
            
            .header h1 {{
                font-size: 2rem;
            }}
            
            .content {{
                padding: 2rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{data.name or 'Portfolio'}</h1>
            <h2>{data.title or 'Professional'}</h2>
        </div>
        <div class="content">
            {html_body}
        </div>
    </div>
</body>
</html>"""
    
    return html_template

@app.post("/api/chat")
async def chat_with_assistant(message: str, context: Optional[Dict[str, Any]] = None):
    return AssistantResponse(
        action="next_step",
        message="어떤 도움이 필요하신가요? 포트폴리오 작성을 도와드리겠습니다.",
        payload={"context": context},
        missing_fields=[],
        stop=False
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)