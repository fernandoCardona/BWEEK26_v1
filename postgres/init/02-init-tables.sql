-- ==========================================
-- PostgreSQL Configuration for Bears Week 2026
-- Optimized for performance and vector operations
-- ==========================================

-- ==========================================
-- ECOMMERCE DATABASE TABLES
-- ==========================================

\c ecommerce_db;

-- Enable extensions (already done in init script, but ensuring)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    telegram_id VARCHAR(100),
    telegram_username VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    email_verified_at TIMESTAMP,
    role VARCHAR(50) DEFAULT 'user',
    preferred_locale VARCHAR(5) DEFAULT 'es',
    registration_source VARCHAR(100),
    interests JSONB,
    newsletter_subscribed BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role);

-- Products table (with translations in JSONB)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name JSONB NOT NULL,
    description JSONB,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product embeddings for semantic search
CREATE TABLE IF NOT EXISTS product_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, locale)
);

CREATE INDEX idx_product_embeddings_vector ON product_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name JSONB NOT NULL,
    description JSONB,
    event_date TIMESTAMP NOT NULL,
    location JSONB,
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    ticket_type VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    source VARCHAR(50),
    interest VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    lead_score INTEGER DEFAULT 0,
    engagement_count INTEGER DEFAULT 0,
    nurturing_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP,
    converted_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);

-- Newsletter campaigns
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject JSONB NOT NULL,
    content JSONB NOT NULL,
    segment VARCHAR(100),
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter logs
CREATE TABLE IF NOT EXISTS newsletter_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_newsletter_logs_campaign ON newsletter_logs(campaign_id);
CREATE INDEX idx_newsletter_logs_user ON newsletter_logs(user_id);

-- Auth logs (audit trail)
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(50),
    action VARCHAR(100),
    ip VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(255),
    success BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_logs_user ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_created ON auth_logs(created_at DESC);

-- Incomplete registrations
CREATE TABLE IF NOT EXISTS incomplete_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(50),
    user_identifier VARCHAR(255),
    partial_data JSONB,
    last_step VARCHAR(100),
    reminder_sent_at TIMESTAMP,
    converted_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    converted_to_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_incomplete_reg_identifier ON incomplete_registrations(user_identifier);
CREATE INDEX idx_incomplete_reg_expires ON incomplete_registrations(expires_at);

-- ==========================================
-- AI MEMORY DATABASE TABLES
-- ==========================================

\c ai_memory_db;

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Knowledge base (vectorized FAQs and documentation)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding vector(1536),
    category VARCHAR(50),
    locale VARCHAR(5),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_locale ON knowledge_base(locale);

-- Conversation context (chatbot memory)
CREATE TABLE IF NOT EXISTS conversation_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    channel VARCHAR(20),
    messages JSONB,
    context_embedding vector(1536),
    last_interaction TIMESTAMP,
    session_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_context_user ON conversation_context(user_id);
CREATE INDEX idx_conversation_context_channel ON conversation_context(channel);
CREATE INDEX idx_conversation_context_embedding ON conversation_context USING ivfflat (context_embedding vector_cosine_ops);

-- User preferences vectors (for recommendations)
CREATE TABLE IF NOT EXISTS user_preferences_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    preference_type VARCHAR(50),
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_type)
);

CREATE INDEX idx_user_prefs_vectors_user ON user_preferences_vectors(user_id);
CREATE INDEX idx_user_prefs_vectors_embedding ON user_preferences_vectors USING ivfflat (embedding vector_cosine_ops);

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

\c ecommerce_db;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bweek_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bweek_admin;

\c ai_memory_db;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bweek_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bweek_admin;

\c n8n_db;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bweek_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bweek_admin;
