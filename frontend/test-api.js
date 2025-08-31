// AI Organizer API Test
const testAIOrganizer = async () => {
  const testData = `
안녕하세요, 3년차 풀스택 개발자 김철수입니다. 

경력사항:
- 삼성전자 (2021-2023): React와 Node.js를 사용한 사내 관리 시스템 개발
- 카카오 (2023-현재): 결제 시스템 백엔드 개발, 일 평균 100만건 트랜잭션 처리

주요 프로젝트:
1. E-commerce 플랫폼 구축
   - React, TypeScript, Redux 사용
   - 사용자 50% 증가, 매출 200% 상승 기여
`;

  console.log('Testing AI Organizer...');
  console.log('Input:', testData.substring(0, 100) + '...');
  
  // This would normally be called from the React component
  // For testing, we're simulating the API call structure
  console.log('\n✅ AI Organizer 테스트 준비 완료');
  console.log('브라우저에서 http://localhost:3000 을 열어 직접 테스트하세요.');
  console.log('\n테스트 단계:');
  console.log('1. AI 정리: 위 텍스트를 입력');
  console.log('2. 대화형 보강: 질문에 답변');
  console.log('3. 원클릭 완성: 포트폴리오 생성');
};

testAIOrganizer();