-- ============================================
-- 로그인 및 마이페이지 기능을 위한 데이터베이스 스키마
-- PostgreSQL 버전
-- 기존 DB와 완전히 독립적으로 동작
-- ============================================

-- UUID 확장 활성화 (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 사용자 계정 테이블
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2. 사용자 기본 정보 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    phone VARCHAR(20),
    birth_date DATE,
    address TEXT,
    github_url VARCHAR(255),
    blog_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    bio TEXT,
    skills JSONB, -- ["React", "TypeScript", "Python"] 형태
    interests JSONB, -- ["웹개발", "AI", "디자인"] 형태
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 3. 사용자 문서 저장 테이블
CREATE TABLE IF NOT EXISTS user_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    position VARCHAR(100),
    content TEXT NOT NULL, -- 문서 전체 내용 (JSON 또는 HTML)
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'submitted', 'archived')),
    deadline_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON user_documents(status);
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON user_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_user_documents_deadline_at ON user_documents(deadline_at);

-- 4. 사용자 문서 버전 히스토리 테이블
CREATE TABLE IF NOT EXISTS user_document_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES user_documents(document_id) ON DELETE CASCADE,
    version INT NOT NULL,
    content TEXT NOT NULL,
    edited_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_document_history_document_id ON user_document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_user_document_history_version ON user_document_history(version);
CREATE INDEX IF NOT EXISTS idx_user_document_history_created_at ON user_document_history(created_at);

-- 5. 포트폴리오 저장 테이블
CREATE TABLE IF NOT EXISTS portfolios (
    portfolio_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    template_type VARCHAR(50), -- "clean", "colorful", "elegant", "minimal"
    theme_color VARCHAR(7), -- HEX 컬러 코드
    layout_config JSONB, -- 레이아웃 설정 JSON
    sections JSONB, -- 섹션 데이터 JSON
    published BOOLEAN DEFAULT FALSE,
    published_url VARCHAR(500) UNIQUE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_published ON portfolios(published);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at);

-- 6. 포트폴리오 프로젝트 테이블 (sections의 일부를 세분화)
CREATE TABLE IF NOT EXISTS portfolio_projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    tech_stack JSONB, -- ["React", "Node.js", "MongoDB"]
    project_url VARCHAR(500),
    github_url VARCHAR(500),
    image_urls JSONB, -- ["url1", "url2", "url3"]
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_portfolio_id ON portfolio_projects(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_display_order ON portfolio_projects(display_order);

-- 7. 세션 관리 테이블 (로그인 세션)
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL, -- JWT 토큰
    refresh_token VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 8. 비밀번호 재설정 토큰 테이블
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- 9. 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activity_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- "login", "logout", "create_portfolio", "edit_document", etc.
    resource_type VARCHAR(50), -- "portfolio", "document", etc.
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- 10. 문서 템플릿 저장 테이블 (사용자가 자주 쓰는 템플릿)
CREATE TABLE IF NOT EXISTS document_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    category VARCHAR(50), -- "기술직", "경영지원", "디자인" etc.
    is_public BOOLEAN DEFAULT FALSE,
    use_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_templates_user_id ON document_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_public ON document_templates(is_public);

-- ============================================
-- 트리거 함수 및 트리거 설정
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- user_profiles 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- user_documents 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS trigger_user_documents_updated_at ON user_documents;
CREATE TRIGGER trigger_user_documents_updated_at
BEFORE UPDATE ON user_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- portfolios 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS trigger_portfolios_updated_at ON portfolios;
CREATE TRIGGER trigger_portfolios_updated_at
BEFORE UPDATE ON portfolios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- portfolio_projects 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS trigger_portfolio_projects_updated_at ON portfolio_projects;
CREATE TRIGGER trigger_portfolio_projects_updated_at
BEFORE UPDATE ON portfolio_projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- document_templates 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS trigger_document_templates_updated_at ON document_templates;
CREATE TRIGGER trigger_document_templates_updated_at
BEFORE UPDATE ON document_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 포트폴리오 수정 시 last_edited_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_portfolio_last_edited()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sections IS DISTINCT FROM NEW.sections OR OLD.layout_config IS DISTINCT FROM NEW.layout_config THEN
        NEW.last_edited_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 포트폴리오 last_edited_at 트리거
DROP TRIGGER IF EXISTS trigger_portfolio_last_edited ON portfolios;
CREATE TRIGGER trigger_portfolio_last_edited
BEFORE UPDATE ON portfolios
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_last_edited();

-- 문서 수정 시 last_edited_at 및 버전 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_document_last_edited()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.last_edited_at = CURRENT_TIMESTAMP;
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 문서 last_edited_at 트리거
DROP TRIGGER IF EXISTS trigger_user_document_last_edited ON user_documents;
CREATE TRIGGER trigger_user_document_last_edited
BEFORE UPDATE ON user_documents
FOR EACH ROW
EXECUTE FUNCTION update_user_document_last_edited();

-- ============================================
-- 샘플 데이터 (개발/테스트용)
-- ============================================

-- 테스트 사용자 (실제 배포 시 삭제)
-- INSERT INTO users (email, password_hash, name, email_verified) VALUES
-- ('test@example.com', '$2b$10$SAMPLE_HASH', '테스트 사용자', TRUE);
