-- ============================================
-- 자소서 첨삭 및 공고 추천 기능을 위한 데이터베이스 스키마
-- 기존 auth_schema.sql과 독립적으로 동작하며 추가 기능 제공
-- ============================================

-- 1. 자소서 첨삭 결과 저장 테이블
CREATE TABLE IF NOT EXISTS cover_letter_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_id UUID REFERENCES user_documents(document_id) ON DELETE SET NULL,

    -- 첨삭 대상 정보
    company_name VARCHAR(200) NOT NULL,
    job_position VARCHAR(100) NOT NULL,
    category VARCHAR(100), -- 회사 카테고리 (대기업, IT 대기업, 외국계 등)

    -- 사용자 스펙 정보 (JSON으로 저장)
    user_specs JSONB, -- {major, gpa, toeic, certificates, etc}

    -- 자소서 문항 및 답변 (JSON 배열)
    questions JSONB NOT NULL, -- [{question, answer, analysis, suggestions}]

    -- AI 분석 결과
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),
    strengths JSONB, -- 강점 배열
    weaknesses JSONB, -- 약점 배열
    suggestions JSONB, -- 개선 제안 배열

    -- 통계 기반 분석
    comparison_stats JSONB, -- 합격자 통계와의 비교 결과
    missing_activities JSONB, -- 누락된 중요 활동

    -- PDF 파일 정보
    pdf_url VARCHAR(500), -- 생성된 PDF 파일 URL (Supabase Storage)
    pdf_generated_at TIMESTAMP,

    -- 메타 정보
    feedback_type VARCHAR(50) DEFAULT 'comprehensive', -- comprehensive, quick, detailed
    is_complete BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cover_letter_feedback_user_id ON cover_letter_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_feedback_document_id ON cover_letter_feedback(document_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_feedback_created_at ON cover_letter_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letter_feedback_company_position ON cover_letter_feedback(company_name, job_position);

-- 2. 공고 데이터 저장 테이블
CREATE TABLE IF NOT EXISTS job_postings (
    posting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 공고 기본 정보
    company_name VARCHAR(200) NOT NULL,
    job_position VARCHAR(200) NOT NULL,
    category VARCHAR(100), -- 직무 카테고리 (개발, 마케팅, 디자인 등)
    company_category VARCHAR(100), -- 회사 카테고리 (대기업, 스타트업 등)

    -- 상세 정보
    description TEXT,
    requirements JSONB, -- 자격 요건 배열
    preferred_qualifications JSONB, -- 우대 사항
    responsibilities JSONB, -- 주요 업무
    tech_stack JSONB, -- 기술 스택 (개발직의 경우)

    -- 근무 조건
    location VARCHAR(200),
    employment_type VARCHAR(50), -- 정규직, 계약직, 인턴 등
    experience_level VARCHAR(50), -- 신입, 경력, 경력무관
    salary_range VARCHAR(100), -- 연봉 범위

    -- 지원 정보
    posting_url VARCHAR(500), -- 원본 공고 URL
    company_url VARCHAR(500),
    application_deadline DATE,

    -- 메타 정보
    source VARCHAR(100), -- 데이터 출처 (saramin, jobkorea, wanted 등)
    is_active BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_company_name ON job_postings(company_name);
CREATE INDEX IF NOT EXISTS idx_job_postings_position ON job_postings(job_position);
CREATE INDEX IF NOT EXISTS idx_job_postings_category ON job_postings(category);
CREATE INDEX IF NOT EXISTS idx_job_postings_company_category ON job_postings(company_category);
CREATE INDEX IF NOT EXISTS idx_job_postings_is_active ON job_postings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_postings_deadline ON job_postings(application_deadline);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);

-- 3. 사용자별 맞춤 공고 추천 테이블
CREATE TABLE IF NOT EXISTS user_job_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    posting_id UUID NOT NULL REFERENCES job_postings(posting_id) ON DELETE CASCADE,

    -- 추천 정보
    match_score INT CHECK (match_score >= 0 AND match_score <= 100),
    match_reasons JSONB, -- 추천 이유 배열

    -- 사용자 반응
    is_bookmarked BOOLEAN DEFAULT FALSE,
    is_applied BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP,

    -- 메타 정보
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_job_recommendations_user_id ON user_job_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_recommendations_posting_id ON user_job_recommendations(posting_id);
CREATE INDEX IF NOT EXISTS idx_user_job_recommendations_match_score ON user_job_recommendations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_job_recommendations_bookmarked ON user_job_recommendations(is_bookmarked);

-- 4. 사용자 관심 공고 북마크 테이블
CREATE TABLE IF NOT EXISTS user_job_bookmarks (
    bookmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    posting_id UUID NOT NULL REFERENCES job_postings(posting_id) ON DELETE CASCADE,

    -- 북마크 정보
    note TEXT, -- 사용자 메모
    tags JSONB, -- 태그 배열

    -- 지원 상태 추적
    application_status VARCHAR(50), -- not_applied, applied, interview, offer, rejected
    application_date DATE,
    interview_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, posting_id)
);

CREATE INDEX IF NOT EXISTS idx_user_job_bookmarks_user_id ON user_job_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_bookmarks_posting_id ON user_job_bookmarks(posting_id);
CREATE INDEX IF NOT EXISTS idx_user_job_bookmarks_status ON user_job_bookmarks(application_status);
CREATE INDEX IF NOT EXISTS idx_user_job_bookmarks_created_at ON user_job_bookmarks(created_at DESC);

-- ============================================
-- 트리거 함수
-- ============================================

-- cover_letter_feedback updated_at 트리거
DROP TRIGGER IF EXISTS trigger_cover_letter_feedback_updated_at ON cover_letter_feedback;
CREATE TRIGGER trigger_cover_letter_feedback_updated_at
BEFORE UPDATE ON cover_letter_feedback
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- job_postings updated_at 트리거
DROP TRIGGER IF EXISTS trigger_job_postings_updated_at ON job_postings;
CREATE TRIGGER trigger_job_postings_updated_at
BEFORE UPDATE ON job_postings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- user_job_recommendations updated_at 트리거
DROP TRIGGER IF EXISTS trigger_user_job_recommendations_updated_at ON user_job_recommendations;
CREATE TRIGGER trigger_user_job_recommendations_updated_at
BEFORE UPDATE ON user_job_recommendations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- user_job_bookmarks updated_at 트리거
DROP TRIGGER IF EXISTS trigger_user_job_bookmarks_updated_at ON user_job_bookmarks;
CREATE TRIGGER trigger_user_job_bookmarks_updated_at
BEFORE UPDATE ON user_job_bookmarks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 유용한 쿼리 함수들
-- ============================================

-- 사용자의 최근 첨삭 결과 조회
CREATE OR REPLACE FUNCTION get_user_recent_feedbacks(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
    feedback_id UUID,
    company_name VARCHAR,
    job_position VARCHAR,
    overall_score INT,
    created_at TIMESTAMP,
    pdf_url VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        clf.feedback_id,
        clf.company_name,
        clf.job_position,
        clf.overall_score,
        clf.created_at,
        clf.pdf_url
    FROM cover_letter_feedback clf
    WHERE clf.user_id = p_user_id
    ORDER BY clf.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 사용자 맞춤 공고 추천 조회 (매칭 점수 순)
CREATE OR REPLACE FUNCTION get_user_recommended_jobs(
    p_user_id UUID,
    p_limit INT DEFAULT 20,
    p_min_score INT DEFAULT 60
)
RETURNS TABLE (
    posting_id UUID,
    company_name VARCHAR,
    job_position VARCHAR,
    match_score INT,
    match_reasons JSONB,
    posting_url VARCHAR,
    application_deadline DATE,
    is_bookmarked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        jp.posting_id,
        jp.company_name,
        jp.job_position,
        ujr.match_score,
        ujr.match_reasons,
        jp.posting_url,
        jp.application_deadline,
        ujr.is_bookmarked
    FROM user_job_recommendations ujr
    JOIN job_postings jp ON ujr.posting_id = jp.posting_id
    WHERE ujr.user_id = p_user_id
        AND jp.is_active = TRUE
        AND ujr.is_dismissed = FALSE
        AND ujr.match_score >= p_min_score
        AND (jp.application_deadline IS NULL OR jp.application_deadline >= CURRENT_DATE)
    ORDER BY ujr.match_score DESC, jp.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 직무별 활성 공고 수 조회
CREATE OR REPLACE FUNCTION get_active_postings_by_category()
RETURNS TABLE (
    category VARCHAR,
    company_category VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        jp.category,
        jp.company_category,
        COUNT(*)::BIGINT
    FROM job_postings jp
    WHERE jp.is_active = TRUE
        AND (jp.application_deadline IS NULL OR jp.application_deadline >= CURRENT_DATE)
    GROUP BY jp.category, jp.company_category
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS) 설정 (선택사항)
-- ============================================

-- cover_letter_feedback에 RLS 활성화
ALTER TABLE cover_letter_feedback ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 첨삭 결과만 조회 가능
CREATE POLICY select_own_feedback ON cover_letter_feedback
    FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자는 자신의 첨삭 결과만 삽입 가능
CREATE POLICY insert_own_feedback ON cover_letter_feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 첨삭 결과만 업데이트 가능
CREATE POLICY update_own_feedback ON cover_letter_feedback
    FOR UPDATE
    USING (auth.uid() = user_id);

-- user_job_recommendations에 RLS 활성화
ALTER TABLE user_job_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_recommendations ON user_job_recommendations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY insert_own_recommendations ON user_job_recommendations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_recommendations ON user_job_recommendations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- user_job_bookmarks에 RLS 활성화
ALTER TABLE user_job_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_bookmarks ON user_job_bookmarks
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY insert_own_bookmarks ON user_job_bookmarks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_bookmarks ON user_job_bookmarks
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY delete_own_bookmarks ON user_job_bookmarks
    FOR DELETE
    USING (auth.uid() = user_id);

-- job_postings는 모든 사용자가 조회 가능
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_all_postings ON job_postings
    FOR SELECT
    USING (true);

-- ============================================
-- 코멘트 추가
-- ============================================

COMMENT ON TABLE cover_letter_feedback IS '사용자의 자소서 첨삭 결과를 저장하는 테이블';
COMMENT ON TABLE job_postings IS '채용 공고 데이터를 저장하는 테이블';
COMMENT ON TABLE user_job_recommendations IS '사용자별 맞춤 공고 추천을 저장하는 테이블';
COMMENT ON TABLE user_job_bookmarks IS '사용자가 북마크한 공고를 저장하는 테이블';
