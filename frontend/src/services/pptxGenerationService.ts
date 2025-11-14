import PizZip from 'pizzip';
import { PortfolioData } from '../types/portfolio';

interface PPTData {
  cover: {
    name: string;
    position: string;
  };
  introduction: {
    one_liner: string;
    introduction: string;
    strength_1: string;
    strength_2: string;
    strength_3: string;
  };
  projects: Array<{
    project_name: string;
    period: string;
    role: string;
    summary: string;
    achievement_1: string;
    achievement_2: string;
    achievement_3: string;
  }>;
  timeline: Array<{
    organization: string;
    position: string;
    period: string;
    achievement: string;
  }>;
  contact: {
    name: string;
    email: string;
    phone: string;
    portfolio_link: string;
  };
}

class PPTXGenerationService {

  /**
   * LLM을 사용하여 포트폴리오 데이터를 PPT 형식으로 변환
   */
  async optimizeForPPT(data: PortfolioData, userProfile?: any): Promise<PPTData> {
    console.log('📊 LLM에 전달되는 원본 데이터:', data);
    console.log('📊 사용자 프로필 데이터:', userProfile);

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });

    // 프로필에서 이름, 이메일, 전화번호 가져오기 (우선순위: 프로필 > 포트폴리오 데이터)
    const userName = userProfile?.name || data.userInfo.name || '이름 없음';
    const userEmail = userProfile?.email || data.userInfo.email || '';
    const userPhone = userProfile?.phone || data.userInfo.phone || '';
    const userPosition = userProfile?.position || data.userInfo.title || '직무 없음';

    const prompt = `
당신은 포트폴리오 데이터를 PPT에 최적화된 형식으로 변환하는 전문가입니다.

=== 입력 데이터 ===
이름: ${userName}
직무: ${userPosition}
자기소개: ${data.userInfo.summary || '자기소개 없음'}
이메일: ${userEmail}
전화번호: ${userPhone}
웹사이트: ${data.userInfo.website || data.userInfo.github || userProfile?.github_url || ''}

스킬: ${data.skills.length > 0 ? data.skills.map(s => s.category + ': ' + s.items.join(', ')).join(' | ') : '스킬 정보 없음'}

프로젝트:
${data.projects.length > 0 ? data.projects.slice(0, 3).map((p, i) => `${i + 1}. ${p.name || '프로젝트명 없음'}
   - 설명: ${p.description || '설명 없음'}
   - 주요 성과: ${p.highlights && p.highlights.length > 0 ? p.highlights.join(', ') : '성과 정보 없음'}
   - 기술: ${p.technologies && p.technologies.length > 0 ? p.technologies.join(', ') : '기술 정보 없음'}`).join('\n') : '프로젝트 정보 없음'}

경력:
${data.experiences.length > 0 ? data.experiences.map((e, i) => `${i + 1}. ${e.company || '회사명 없음'} - ${e.position || '직무 없음'}
   - 기간: ${e.startDate || '시작일 미정'} ~ ${e.endDate || '현재'}
   - 주요 성과: ${e.achievements && e.achievements.length > 0 ? e.achievements.join(', ') : '성과 정보 없음'}`).join('\n') : '경력 정보 없음'}

교육:
${data.education.length > 0 ? data.education.map((e, i) => `${i + 1}. ${e.institution || e.school || '학교명 없음'} - ${e.degree || '학위 없음'}`).join('\n') : '교육 정보 없음'}

=== 요구사항 ===
위 데이터를 아래 JSON 형식으로 변환하세요:

{
  "cover": {
    "name": "이름 (프로필에서 가져온 실제 이름 사용)",
    "position": "직무/포지션"
  },
  "introduction": {
    "one_liner": "한줄 소개 (사용자가 입력한 자기소개 그대로 사용, 수정하지 말 것)",
    "introduction": "개인 소개 (4-6문장, 주요 경력/강점/관심 분야를 자세히 설명. 각 문장마다 줄바꿈 넣어서 \\n으로 구분)",
    "strength_1": "핵심 강점 1",
    "strength_2": "핵심 강점 2",
    "strength_3": "핵심 강점 3"
  },
  "projects": [
    {
      "project_name": "프로젝트명",
      "period": "YYYY.MM - YYYY.MM 형식",
      "role": "역할",
      "summary": "프로젝트의 목적/가치 한줄 요약",
      "achievement_1": "핵심 성과 1",
      "achievement_2": "핵심 성과 2",
      "achievement_3": "핵심 성과 3"
    }
  ] (최대 3개),
  "timeline": [
    {
      "organization": "기관/회사명",
      "position": "직무/전공",
      "period": "YYYY.MM - YYYY.MM 형식",
      "achievement": "핵심 성과/활동 한줄"
    }
  ] (경력 + 교육 합쳐서 최대 4개),
  "contact": {
    "name": "이름 (프로필에서 가져온 실제 이름)",
    "email": "이메일 (프로필에서 가져온 실제 이메일)",
    "phone": "전화번호 (프로필에서 가져온 실제 전화번호)",
    "portfolio_link": "포트폴리오/웹 링크"
  }
}

**중요**:
- one_liner는 사용자가 입력한 자기소개를 그대로 사용하세요 (수정하지 마세요)
- introduction은 4-6문장으로 자세하게 작성하고, 각 문장 끝에 \\n을 넣어주세요
- 이름, 이메일, 전화번호는 프로필 데이터를 우선 사용
- 날짜는 YYYY.MM 형식으로 통일
- 성과는 구체적인 수치나 결과 포함
`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a PPT portfolio optimizer. Respond only with valid JSON. 한국어로 작성하세요." },
          { role: "user", content: prompt }
        ],
        max_tokens: 2500,
      });

      let content = response.choices[0].message?.content || "{}";
      console.log('🤖 LLM 원본 응답:', content);

      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const result = JSON.parse(content);
      console.log('✅ LLM 파싱 결과:', result);
      return result;
    } catch (error) {
      console.error('❌ PPT 데이터 최적화 실패:', error);
      console.log('⚠️ Fallback 데이터 사용');

      // 기본값 반환
      const fallbackData: PPTData = {
        cover: {
          name: userName,
          position: userPosition
        },
        introduction: {
          one_liner: data.userInfo.summary || '포트폴리오',
          introduction: data.userInfo.summary || '자기소개를 입력해주세요.',
          strength_1: data.skills[0]?.category || data.skills[0]?.items[0] || '강점 1',
          strength_2: data.skills[1]?.category || data.skills[1]?.items[0] || '강점 2',
          strength_3: data.skills[2]?.category || data.skills[2]?.items[0] || '강점 3'
        },
        projects: data.projects.slice(0, 3).map((p, i) => ({
          project_name: p.name || `프로젝트 ${i + 1}`,
          period: p.date || '2024.01 - 2024.12',
          role: '개발자',
          summary: p.description || '프로젝트 설명',
          achievement_1: p.highlights?.[0] || '주요 성과 1',
          achievement_2: p.highlights?.[1] || '주요 성과 2',
          achievement_3: p.highlights?.[2] || '주요 성과 3'
        })),
        timeline: [
          ...data.experiences.slice(0, 3).map(e => ({
            organization: e.company || '회사명',
            position: e.position || '직무',
            period: `${e.startDate || '2023.01'} - ${e.endDate || '현재'}`,
            achievement: e.achievements?.[0] || '주요 업무'
          })),
          ...data.education.slice(0, 1).map(e => ({
            organization: e.institution || e.school || '학교명',
            position: e.degree || '학위',
            period: `${e.startDate || '2020.03'} - ${e.endDate || '2024.02'}`,
            achievement: '학업 이수'
          }))
        ].slice(0, 4),
        contact: {
          name: userName,
          email: userEmail || 'email@example.com',
          phone: userPhone || '010-0000-0000',
          portfolio_link: data.userInfo.website || data.userInfo.github || userProfile?.github_url || 'https://github.com'
        }
      };

      // projects가 3개 미만이면 빈 프로젝트 추가
      while (fallbackData.projects.length < 3) {
        fallbackData.projects.push({
          project_name: `프로젝트 ${fallbackData.projects.length + 1}`,
          period: '2024.01 - 2024.12',
          role: '개발자',
          summary: '프로젝트 설명을 입력해주세요',
          achievement_1: '성과 1',
          achievement_2: '성과 2',
          achievement_3: '성과 3'
        });
      }

      // timeline이 4개 미만이면 빈 항목 추가
      while (fallbackData.timeline.length < 4) {
        fallbackData.timeline.push({
          organization: '기관명',
          position: '직무/전공',
          period: '2023.01 - 2024.12',
          achievement: '주요 활동'
        });
      }

      console.log('📦 Fallback 데이터:', fallbackData);
      return fallbackData;
    }
  }

  /**
   * XML 특수문자 이스케이프
   */
  private escapeXML(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * XML에서 특정 텍스트를 정확히 찾아서 교체 (디자인과 서식 유지)
   * Python 코드의 replace_text_in_shape 로직을 JavaScript로 구현
   */
  private replaceTextInXML(xml: string, oldText: string, newText: string): string {
    if (!oldText || !newText) return xml;

    const escapedNew = this.escapeXML(newText);
    const trimmedOld = oldText.trim();

    // <a:t> 태그 내의 텍스트를 정확히 매칭해서 교체
    const regex = /<a:t>([^<]*?)<\/a:t>/g;

    return xml.replace(regex, (match, content) => {
      if (content.trim() === trimmedOld) {
        return `<a:t>${escapedNew}</a:t>`;
      }
      return match;
    });
  }

  /**
   * PPT 파일 생성
   */
  async generatePPT(data: PortfolioData, templatePath: string, userProfile?: any): Promise<Blob> {
    try {
      console.log('=== PPT 생성 시작 ===');

      // 1. 템플릿 파일 로드
      const response = await fetch(templatePath);
      const templateBuffer = await response.arrayBuffer();
      const zip = new PizZip(templateBuffer);

      // 2. LLM으로 데이터 최적화
      console.log('LLM 데이터 최적화 중...');
      const pptData = await this.optimizeForPPT(data, userProfile);
      console.log('최적화 완료:', pptData);

      // 3. Slide 1: 표지 + 연락처
      let slide1 = zip.file('ppt/slides/slide1.xml')?.asText() || '';
      slide1 = this.replaceTextInXML(slide1, '[이름]', pptData.cover.name);
      slide1 = this.replaceTextInXML(slide1, '[직무/포지션]', pptData.cover.position);
      slide1 = this.replaceTextInXML(slide1, '[이메일]', pptData.contact.email);
      slide1 = this.replaceTextInXML(slide1, '[전화번호]', pptData.contact.phone);
      slide1 = this.replaceTextInXML(slide1, '[포트폴리오/웹 링크]', pptData.contact.portfolio_link);
      zip.file('ppt/slides/slide1.xml', slide1);
      console.log('✅ Slide 1 완료 (표지 + 연락처)');

      // 4. Slide 2: 자기소개
      let slide2 = zip.file('ppt/slides/slide2.xml')?.asText() || '';
      slide2 = this.replaceTextInXML(slide2, '[한줄 소개]', pptData.introduction.one_liner);
      slide2 = this.replaceTextInXML(slide2, '[개인 소개: 주요 경력/강점/관심 분야를 3~4문장으로 작성]', pptData.introduction.introduction);
      slide2 = this.replaceTextInXML(slide2, '[핵심 강점 1]', pptData.introduction.strength_1);
      slide2 = this.replaceTextInXML(slide2, '[핵심 강점 2]', pptData.introduction.strength_2);
      slide2 = this.replaceTextInXML(slide2, '[핵심 강점 3]', pptData.introduction.strength_3);
      zip.file('ppt/slides/slide2.xml', slide2);
      console.log('✅ Slide 2 완료 (자기소개)');

      // 5. Slide 3~5: 프로젝트 3개
      for (let i = 0; i < 3 && i < pptData.projects.length; i++) {
        const project = pptData.projects[i];
        const slideNum = i + 3;
        let slideXml = zip.file(`ppt/slides/slide${slideNum}.xml`)?.asText() || '';

        slideXml = this.replaceTextInXML(slideXml, '[프로젝트명]', project.project_name);
        slideXml = this.replaceTextInXML(slideXml, '[YYYY.MM - YYYY.MM]', project.period);
        slideXml = this.replaceTextInXML(slideXml, '[기간]', project.period);
        slideXml = this.replaceTextInXML(slideXml, '[역할]', project.role);
        slideXml = this.replaceTextInXML(slideXml, '[프로젝트의 목적/가치에 대한 한줄 요약]', project.summary);
        slideXml = this.replaceTextInXML(slideXml, '[한줄 요약]', project.summary);
        slideXml = this.replaceTextInXML(slideXml, '[핵심 성과 1]', project.achievement_1);
        slideXml = this.replaceTextInXML(slideXml, '[핵심 성과 2]', project.achievement_2);
        slideXml = this.replaceTextInXML(slideXml, '[핵심 성과 3]', project.achievement_3);

        zip.file(`ppt/slides/slide${slideNum}.xml`, slideXml);
        console.log(`✅ Slide ${slideNum} 완료 (프로젝트 ${i + 1})`);
      }

      // 6. Slide 6: 타임라인
      let slide6 = zip.file('ppt/slides/slide6.xml')?.asText() || '';
      for (let i = 0; i < 4 && i < pptData.timeline.length; i++) {
        const item = pptData.timeline[i];
        const orgText = `${item.organization} · ${item.position}`;

        // 순차적으로 플레이스홀더 교체
        slide6 = slide6.replace(
          '<a:t>[기관/회사] · [직무/전공]</a:t>',
          `<a:t>${this.escapeXML(orgText)}</a:t>`
        );
        slide6 = slide6.replace(
          '<a:t>[기간]</a:t>',
          `<a:t>${this.escapeXML(item.period)}</a:t>`
        );
        slide6 = slide6.replace(
          '<a:t>[핵심 성과/활동 1]</a:t>',
          `<a:t>${this.escapeXML(item.achievement)}</a:t>`
        );
      }
      zip.file('ppt/slides/slide6.xml', slide6);
      console.log('✅ Slide 6 완료 (타임라인)');

      // 7. Slide 7: 연락처
      let slide7 = zip.file('ppt/slides/slide7.xml')?.asText() || '';
      slide7 = this.replaceTextInXML(slide7, '[이름]', pptData.contact.name);
      slide7 = this.replaceTextInXML(slide7, '[이메일]', pptData.contact.email);
      slide7 = this.replaceTextInXML(slide7, '[전화번호]', pptData.contact.phone);
      slide7 = this.replaceTextInXML(slide7, '[포트폴리오/웹 링크]', pptData.contact.portfolio_link);
      zip.file('ppt/slides/slide7.xml', slide7);
      console.log('✅ Slide 7 완료 (연락처)');

      // 8. ZIP을 Blob으로 변환
      const blob = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });

      console.log('=== PPT 생성 완료 ===');
      return blob;
    } catch (error) {
      console.error('PPT 생성 실패:', error);
      throw error;
    }
  }

  /**
   * PPT 파일 다운로드
   */
  downloadPPT(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default new PPTXGenerationService();
