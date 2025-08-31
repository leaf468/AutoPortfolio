# {{name}}의 개발자 포트폴리오

> {{oneLinerPitch}}

## 📞 연락처
- 이메일: developer@example.com
- 전화: 010-1234-5678
- GitHub: https://github.com/developer

## 💼 전문 요약
{{summary}}

---

## 🏢 경력사항

{{#experiences}}
### {{company}} - {{position}}
**기간**: {{duration}}

**주요 업무**:
{{#responsibilities}}
- {{.}}
{{/responsibilities}}

**핵심 성과**:
{{#achievements}}
- 🎯 {{.}}
{{/achievements}}

**사용 기술**: {{#technologies}}{{.}}{{^last}}, {{/last}}{{/technologies}}

**비즈니스 임팩트**: {{impact}}

---
{{/experiences}}

## 🚀 주요 프로젝트

{{#projects}}
### 📱 {{name}}
{{summary}}

**담당 역할**: {{myRole}}

**주요 책임**:
{{#responsibilities}}
- {{.}}
{{/responsibilities}}

**달성 성과**:
{{#achievements}}
- ✨ {{.}}
{{/achievements}}

**기술 스택**: {{#technologies}}`{{.}}`{{^last}} • {{/last}}{{/technologies}}

{{#url}}**프로젝트 URL**: {{url}}{{/url}}
{{#githubUrl}}**GitHub**: {{githubUrl}}{{/githubUrl}}

**프로젝트 임팩트**: {{impact}}
{{#metrics}}**주요 지표**: {{metrics}}{{/metrics}}

---
{{/projects}}

## 🛠 기술 역량

{{#skills}}
### {{category}}
**기술**: {{#skills}}{{value}}{{^last}} | {{/last}}{{/skills}}
**경험**: {{experience}}
**숙련도**: {{proficiency}}

{{/skills}}

---

## 🏆 주요 성과

{{#achievements}}
- 🌟 {{.}}
{{/achievements}}

---

## 🔑 핵심 키워드

**기술 키워드**: {{#keywords.technical}}{{.}}{{^last}}, {{/last}}{{/keywords.technical}}

**소프트 스킬**: {{#keywords.soft}}{{.}}{{^last}}, {{/last}}{{/keywords.soft}}

**산업 도메인**: {{#keywords.industry}}{{.}}{{^last}}, {{/last}}{{/keywords.industry}}

**ATS 키워드**: {{#keywords.ats}}{{.}}{{^last}}, {{/last}}{{/keywords.ats}}

---

*포트폴리오 생성일: {{timestamp}}*
*템플릿: {{template}}*