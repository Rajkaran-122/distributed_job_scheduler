-- V1: Extensions and shared trigger function
-- gen_random_uuid() is built into PostgreSQL core since v13 (no pgcrypto extension needed).
-- pg_trgm enables fast ILIKE / fuzzy search on job names for the dashboard's global search feature.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- NOTE ON ENUM-LIKE COLUMNS: earlier revisions of this migration modeled job/worker/role
-- state columns as CREATE DOMAIN ... AS TEXT CHECK (...). That was reverted: Hibernate's
-- schema validator resolves a domain's JDBC metadata type name to the domain name itself
-- (e.g. "job_status"), not the underlying base type ("text"/"varchar"), which made every
-- @Enumerated(EnumType.STRING) field in the app fail `hibernate.hbm2ddl.auto=validate`
-- with "wrong column type encountered ... expecting varchar(n)". Every enum-like column
-- in this schema is therefore a plain VARCHAR(20) with an inline CHECK constraint instead
-- (see V2/V4/V5/V6/V8) -- functionally identical (still whitelist-enforced at the DB
-- layer) but Hibernate-validate-compatible, and consistent with how backoff_strategy and
-- dead_letter_jobs.resolution were already modeled.

-- Shared trigger function: keeps updated_at current on every UPDATE without relying on
-- application code to remember to set it (used across organizations, jobs, queues, etc).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
