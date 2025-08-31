// AI Organizer 직접 테스트
const testInput = `안녕하세요, 3년차 풀스택 개발자 김철수입니다.

경력사항:
- 네이버 (2021-2023): React와 Node.js를 사용한 웹 서비스 개발
  * 월 활성 사용자 100만명 서비스 운영
  * 페이지 로딩 속도 40% 개선
  * 팀 리더로 5명 개발자 관리

- 카카오 (2023-현재): 백엔드 API 서버 개발 및 운영
  * 일 평균 100만건 API 요청 처리
  * 서버 응답 시간 200ms 이하 달성

주요 프로젝트:
1. E-commerce 플랫폼 구축
   - React, TypeScript, Redux로 프론트엔드 개발
   - 사용자 50% 증가, 매출 200% 상승 기여
   - 팀 리더로서 5명 개발팀 관리

2. 실시간 채팅 시스템 개발
   - WebSocket, Redis를 활용한 실시간 통신
   - 동시 접속자 10,000명 처리

기술 스택:
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Python, Java
- Database: MySQL, MongoDB, Redis`;

console.log('=== AI 정리 기능 테스트 ===');
console.log('');
console.log('테스트 입력 데이터:');
console.log(testInput);
console.log('');
console.log('입력 데이터 길이:', testInput.length, '문자');
console.log('');
console.log('예상 결과:');
console.log('- oneLinerPitch: "3년차 풀스택 개발자..."');
console.log('- experiences: 2개 (네이버, 카카오)');
console.log('- projects: 2개 (E-commerce, 채팅시스템)');
console.log('- skills: Frontend, Backend, Database 카테고리');
console.log('- achievements: 구체적 수치 포함한 성과들');
console.log('');
console.log('✅ AI 정리 테스트 데이터 준비 완료');
console.log('');
console.log('🔗 실제 테스트: http://localhost:3000');
console.log('위 데이터를 2단계 "AI 정리"에 입력하세요!');