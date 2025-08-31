// 자동 워크플로우 테스트 스크립트
const testData = {
  // 1단계: 테스트 템플릿
  template: `# {{name}}의 포트폴리오

## 소개
{{summary}}

## 경력 사항
{{#experiences}}
### {{company}} - {{position}}
- **기간**: {{duration}}
- **임팩트**: {{impact}}

**주요 성과**:
{{#achievements}}
- {{.}}
{{/achievements}}

**사용 기술**: {{#technologies}}{{.}}, {{/technologies}}
{{/experiences}}

## 주요 프로젝트
{{#projects}}
### {{name}}
{{summary}}

**역할**: {{myRole}}
**성과**: {{impact}}
{{/projects}}

## 기술 스택
{{#skills}}
**{{category}}**: {{#skills}}{{value}}{{^last}}, {{/last}}{{/skills}}
{{/skills}}`,

  // 2단계: 개인 정보
  personalInfo: `안녕하세요, 3년차 풀스택 개발자 김철수입니다.

경력사항:
- 네이버 (2021-2023): React와 Node.js를 사용한 웹 서비스 개발
  * 월 활성 사용자 100만명 서비스 운영
  * 페이지 로딩 속도 40% 개선
  * 팀 리더로 5명 개발자 관리

- 카카오 (2023-현재): 백엔드 API 서버 개발 및 운영
  * 일 평균 100만건 API 요청 처리
  * 서버 응답 시간 200ms 이하 달성
  * 마이크로서비스 아키텍처 구축

주요 프로젝트:
1. E-commerce 플랫폼 구축
   - React, TypeScript, Redux로 프론트엔드 개발
   - 사용자 50% 증가, 매출 200% 상승 기여
   - 팀 리더로서 5명 개발팀 관리

2. 실시간 채팅 시스템 개발
   - WebSocket, Redis를 활용한 실시간 통신
   - 동시 접속자 10,000명 처리
   - 메시지 전송 지연 50ms 이하 달성

3. 데이터 분석 대시보드
   - Python, Django로 백엔드 API 개발
   - Chart.js로 실시간 데이터 시각화
   - 관리자 업무 효율성 30% 향상

기술 스택:
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Python, Java, Django
- Database: MySQL, MongoDB, Redis
- DevOps: Docker, Kubernetes, AWS, Jenkins
- Tools: Git, Jira, Slack

학력:
서울대학교 컴퓨터공학과 졸업 (2018-2021)`,

  // 3단계: 예상 질문 답변들
  sampleAnswers: {
    "프로젝트 기간": "6개월",
    "팀 규모": "5명",
    "사용자 증가율": "50",
    "매출 증가율": "200",
    "동시 접속자 수": "10000",
    "응답 시간": "200",
    "페이지 속도 개선": "40"
  }
};

console.log('=== AI 포트폴리오 자동 테스트 시작 ===');
console.log('');

console.log('1단계: 템플릿 업로드');
console.log('템플릿 길이:', testData.template.length, '문자');
console.log('템플릿 미리보기:');
console.log(testData.template.substring(0, 200) + '...');
console.log('✅ 템플릿 준비 완료');
console.log('');

console.log('2단계: AI 정리용 개인정보');
console.log('정보 길이:', testData.personalInfo.length, '문자');
console.log('정보 요약:', testData.personalInfo.substring(0, 100) + '...');
console.log('✅ 개인정보 준비 완료');
console.log('');

console.log('3단계: 예상 질문 답변');
Object.entries(testData.sampleAnswers).forEach(([question, answer]) => {
  console.log(`Q: ${question} → A: ${answer}`);
});
console.log('✅ 답변 데이터 준비 완료');
console.log('');

console.log('4단계: 통합 테스트 시뮬레이션');
console.log('- 템플릿에서 {{name}} 찾기:', testData.template.includes('{{name}}') ? '✅' : '❌');
console.log('- 템플릿에서 {{summary}} 찾기:', testData.template.includes('{{summary}}') ? '✅' : '❌');
console.log('- 템플릿에서 {{experiences}} 찾기:', testData.template.includes('{{#experiences}}') ? '✅' : '❌');
console.log('- 템플릿에서 {{projects}} 찾기:', testData.template.includes('{{#projects}}') ? '✅' : '❌');
console.log('');

console.log('=== 자동 테스트 데이터 준비 완료 ===');
console.log('');
console.log('🔗 브라우저에서 테스트: http://localhost:3000');
console.log('');
console.log('📋 테스트 순서:');
console.log('1. 위 템플릿을 복사하여 1단계에 붙여넣기');
console.log('2. 위 개인정보를 2단계 AI 정리에 입력');
console.log('3. 3단계에서 질문에 답변');
console.log('4. 4단계에서 포트폴리오 생성 확인');

module.exports = testData;