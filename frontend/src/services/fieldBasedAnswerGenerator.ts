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

/**
 * 지원 동기 필드로부터 답변 생성
 */
export function generateMotivationAnswer(fields: MotivationFields): string {
  const parts: string[] = [];

  // 관심 계기
  if (fields.whenKnew && fields.whatAttracted) {
    parts.push(
      `저는 ${fields.whenKnew} ${fields.companyName}을(를) 알게 되었고, ${fields.whatAttracted}에 큰 매력을 느꼈습니다.`
    );
  }

  // 지원 이유
  if (fields.whyThis) {
    parts.push(
      `${fields.position} 직무에 지원하게 된 이유는 ${fields.whyThis}이기 때문입니다.`
    );
  }

  // 개인 목표와 연결
  if (fields.personalGoal && fields.howAlign) {
    parts.push(
      `저는 ${fields.personalGoal}라는 목표를 가지고 있으며, ${fields.howAlign}고 생각합니다.`
    );
  }

  // 마무리
  parts.push(
    `${fields.companyName}에서 ${fields.position}(으)로서 제 역량을 발휘하고 성장하고 싶습니다.`
  );

  return parts.join(' ');
}

/**
 * 경험/프로젝트 필드로부터 답변 생성
 */
export function generateExperienceAnswer(fields: ExperienceFields): string {
  const parts: string[] = [];

  // 프로젝트 개요
  if (fields.projectName && fields.period) {
    const teamInfo = fields.teamSize ? ` ${fields.teamSize} 규모의 팀에서` : '';
    parts.push(
      `저는 ${fields.period} 동안${teamInfo} '${fields.projectName}' 프로젝트를 수행했습니다.`
    );
  }

  // 역할 및 기술
  if (fields.myRole) {
    const techStack = fields.technologies.length > 0
      ? `, ${fields.technologies.join(', ')} 등의 기술을 활용했습니다`
      : '';
    parts.push(
      `이 프로젝트에서 저는 ${fields.myRole}을(를) 담당했으며${techStack}.`
    );
  }

  // 문제와 해결
  if (fields.problem && fields.solution) {
    parts.push(
      `${fields.problem} 문제를 해결하기 위해 ${fields.solution}을(를) 도입했습니다.`
    );
  }

  // 성과
  if (fields.achievementMetric) {
    parts.push(
      `그 결과 ${fields.achievementMetric}의 성과를 달성했습니다.`
    );
  }

  // 어려움과 극복
  if (fields.difficulty && fields.howOvercome) {
    parts.push(
      `프로젝트 진행 중 ${fields.difficulty} 등의 어려움이 있었지만, ${fields.howOvercome}을(를) 통해 극복할 수 있었습니다.`
    );
  }

  // 배운 점
  if (fields.lesson) {
    parts.push(
      `이 경험을 통해 ${fields.lesson}을(를) 배웠습니다.`
    );
  }

  return parts.join(' ');
}

/**
 * 강점 필드로부터 답변 생성 (STAR 기법)
 */
export function generateStrengthAnswer(fields: StrengthFields): string {
  const parts: string[] = [];

  // 강점 소개
  if (fields.mainStrength && fields.whyStrength) {
    parts.push(
      `저의 가장 큰 강점은 ${fields.mainStrength}입니다. ${fields.whyStrength}.`
    );
  }

  // Situation (상황)
  if (fields.when && fields.situation) {
    parts.push(
      `${fields.when}, ${fields.situation} 상황이 있었습니다.`
    );
  }

  // Task & Action (행동)
  if (fields.action) {
    parts.push(
      `저는 ${fields.action}을(를) 실행했습니다.`
    );
  }

  // Result (결과)
  if (fields.result) {
    parts.push(
      `그 결과, ${fields.result}.`
    );
  }

  // 피드백
  if (fields.feedback) {
    parts.push(
      `${fields.feedback}.`
    );
  }

  // 직무 연관성
  if (fields.relevance) {
    parts.push(
      `이러한 강점은 ${fields.relevance}에 기여할 수 있다고 생각합니다.`
    );
  }

  return parts.join(' ');
}

/**
 * 포부 필드로부터 답변 생성
 */
export function generateVisionAnswer(fields: VisionFields): string {
  const parts: string[] = [];

  // 단기 목표
  if (fields.shortTermGoal && fields.shortTermAction) {
    parts.push(
      `입사 후 단기적으로는 ${fields.shortTermGoal}을(를) 목표로 하고 있습니다. 이를 위해 ${fields.shortTermAction}을(를) 실천하겠습니다.`
    );
  }

  // 중기 목표
  if (fields.mediumTermGoal && fields.mediumTermAction) {
    parts.push(
      `중기적으로는 ${fields.mediumTermGoal}을(를) 달성하고자 하며, ${fields.mediumTermAction}을(를) 통해 역량을 강화하겠습니다.`
    );
  }

  // 장기 비전
  if (fields.longTermVision && fields.longTermAction) {
    parts.push(
      `장기적으로는 ${fields.longTermVision}을(를) 그리고 있습니다. ${fields.longTermAction}을(를) 통해 이 비전을 실현해 나가겠습니다.`
    );
  }

  // 회사 기여
  if (fields.companyContribution && fields.specificValue) {
    parts.push(
      `저는 ${fields.companyContribution}을(를) 통해 회사에 기여하고자 하며, 구체적으로 ${fields.specificValue} 등의 가치를 창출하겠습니다.`
    );
  }

  return parts.join(' ');
}

/**
 * 성장 과정 필드로부터 답변 생성
 */
export function generateGrowthAnswer(fields: GrowthFields): string {
  const parts: string[] = [];

  // 성장 배경
  if (fields.backgroundSummary) {
    parts.push(fields.backgroundSummary);
  }

  // 핵심 사건
  if (fields.keyEvent && fields.whenOccurred && fields.whatHappened) {
    parts.push(
      `${fields.whenOccurred}, ${fields.keyEvent}이(가) 있었습니다. ${fields.whatHappened}`
    );
  }

  // 영향
  if (fields.howInfluenced) {
    parts.push(
      `이 경험을 통해 ${fields.howInfluenced}`
    );
  }

  // 현재 영향
  if (fields.currentImpact) {
    parts.push(
      `이는 현재 ${fields.currentImpact}`
    );
  }

  // 가치관
  if (fields.relatedValue) {
    parts.push(
      `저는 ${fields.relatedValue}는 가치관을 갖게 되었습니다.`
    );
  }

  return parts.join(' ');
}

/**
 * 실패/극복 경험 필드로부터 답변 생성
 */
export function generateFailureAnswer(fields: FailureFields): string {
  const parts: string[] = [];

  // 상황 및 실패
  if (fields.situationDesc && fields.whatFailed) {
    parts.push(
      `${fields.situationDesc} 하지만 ${fields.whatFailed}`
    );
  }

  // 실패 원인
  if (fields.whyFailed) {
    parts.push(
      `이는 ${fields.whyFailed}기 때문이었습니다.`
    );
  }

  // 감정적 영향
  if (fields.emotionalImpact) {
    parts.push(
      fields.emotionalImpact
    );
  }

  // 전환점 및 행동
  if (fields.turningPoint && fields.actionTaken) {
    parts.push(
      `하지만 ${fields.turningPoint} 그리고 ${fields.actionTaken}`
    );
  }

  // 결과
  if (fields.result) {
    parts.push(
      `그 결과, ${fields.result}`
    );
  }

  // 배운 점 및 적용
  if (fields.lessonLearned && fields.howApply) {
    parts.push(
      `이 경험을 통해 ${fields.lessonLearned} ${fields.howApply}`
    );
  }

  return parts.join(' ');
}

/**
 * 협업/리더십 필드로부터 답변 생성
 */
export function generateTeamworkAnswer(fields: TeamworkFields): string {
  const parts: string[] = [];

  // 프로젝트 배경
  if (fields.projectContext && fields.teamSize && fields.myRole) {
    parts.push(
      `${fields.projectContext}에서 ${fields.teamSize} 팀의 ${fields.myRole} 역할을 맡았습니다.`
    );
  }

  // 어려움
  if (fields.challenge && fields.whyDifficult) {
    parts.push(
      `프로젝트 진행 중 ${fields.challenge}이(가) 발생했습니다. ${fields.whyDifficult}`
    );
  }

  // 해결 과정
  if (fields.approach && fields.communicationMethod) {
    parts.push(
      `이를 해결하기 위해 ${fields.approach} ${fields.communicationMethod}을(를) 통해 팀원들과 소통했습니다.`
    );
  }

  // 결과
  if (fields.result) {
    parts.push(
      `그 결과, ${fields.result}`
    );
  }

  // 피드백 및 배움
  if (fields.teamFeedback) {
    parts.push(
      fields.teamFeedback
    );
  }

  if (fields.lessonsOnTeamwork) {
    parts.push(
      `이 경험을 통해 ${fields.lessonsOnTeamwork}을(를) 배웠습니다.`
    );
  }

  return parts.join(' ');
}

/**
 * 갈등 해결 필드로부터 답변 생성
 */
export function generateConflictAnswer(fields: ConflictFields): string {
  const parts: string[] = [];

  // 갈등 상황 및 당사자
  if (fields.situation && fields.parties) {
    parts.push(
      `${fields.situation} 상황에서 ${fields.parties} 사이에 갈등이 발생했습니다.`
    );
  }

  // 갈등 원인
  if (fields.cause) {
    parts.push(
      `이는 ${fields.cause}로 인한 것이었습니다.`
    );
  }

  // 양측 입장
  if (fields.myPosition && fields.otherPosition) {
    parts.push(
      `저는 ${fields.myPosition}을(를) 주장했고, 상대방은 ${fields.otherPosition}을(를) 원했습니다.`
    );
  }

  // 해결 접근 및 소통
  if (fields.approachTaken) {
    parts.push(
      `이를 해결하기 위해 ${fields.approachTaken}을(를) 시도했습니다.`
    );
  }

  if (fields.communication) {
    parts.push(
      fields.communication
    );
  }

  // 타협점
  if (fields.compromise) {
    parts.push(
      `결국 ${fields.compromise}라는 타협점을 찾았습니다.`
    );
  }

  // 결과
  if (fields.outcome) {
    parts.push(
      `그 결과, ${fields.outcome}`
    );
  }

  // 배운 점
  if (fields.lessonsLearned) {
    parts.push(
      `이 경험을 통해 ${fields.lessonsLearned}을(를) 배웠습니다.`
    );
  }

  return parts.join(' ');
}

/**
 * 필드 타입에 따라 적절한 생성 함수 호출
 */
export function generateAnswerFromFields(
  fieldType: 'motivation' | 'experience' | 'strength' | 'vision' | 'growth' | 'failure' | 'teamwork' | 'conflict',
  fields: MotivationFields | ExperienceFields | StrengthFields | VisionFields | GrowthFields | FailureFields | TeamworkFields | ConflictFields
): string {
  switch (fieldType) {
    case 'motivation':
      return generateMotivationAnswer(fields as MotivationFields);
    case 'experience':
      return generateExperienceAnswer(fields as ExperienceFields);
    case 'strength':
      return generateStrengthAnswer(fields as StrengthFields);
    case 'vision':
      return generateVisionAnswer(fields as VisionFields);
    case 'growth':
      return generateGrowthAnswer(fields as GrowthFields);
    case 'failure':
      return generateFailureAnswer(fields as FailureFields);
    case 'teamwork':
      return generateTeamworkAnswer(fields as TeamworkFields);
    case 'conflict':
      return generateConflictAnswer(fields as ConflictFields);
    default:
      return '';
  }
}
