-- PostgreSQL initialization script
-- Runs once when the container is first created.

-- Ensure the database and role exist (already created by env vars)
-- Extensions useful for telecom platform
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for full-text search

-- Set timezone
SET timezone = 'UTC';
