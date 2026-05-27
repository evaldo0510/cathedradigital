
-- RLS Regression Tests for Cathedra Digital
-- This file contains SQL-based tests for Row Level Security policies.
-- It verifies that admins and users have the correct access levels.

BEGIN;

-- 1. Setup helper functions for testing
CREATE OR REPLACE FUNCTION tests.assert_can_select(tbl_name text, role_name text) RETURNS boolean AS $$
DECLARE
    can_select boolean;
BEGIN
    EXECUTE format('SET ROLE %I', role_name);
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I LIMIT 1)', tbl_name) INTO can_select;
    RESET ROLE;
    RETURN can_select;
EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 2. Test Cases for touched tables

-- Theme Contents: Admin only manage
DO $$
BEGIN
    -- This should fail for anon
    IF tests.assert_can_select('theme_contents', 'anon') THEN
        RAISE EXCEPTION 'RLS Failure: Anon can select from theme_contents';
    END IF;
    
    -- This should succeed for admin (service_role)
    IF NOT tests.assert_can_select('theme_contents', 'service_role') THEN
        RAISE EXCEPTION 'RLS Failure: Service role cannot select from theme_contents';
    END IF;
END $$;

-- Analytics Events: Users see own, Admins see all
DO $$
BEGIN
    -- This should fail for anon
    IF tests.assert_can_select('analytics_events', 'anon') THEN
        RAISE EXCEPTION 'RLS Failure: Anon can select from analytics_events';
    END IF;
END $$;

-- Visual Regression: Admin only
DO $$
BEGIN
    IF tests.assert_can_select('visual_regression_runs', 'anon') THEN
        RAISE EXCEPTION 'RLS Failure: Anon can select from visual_regression_runs';
    END IF;
END $$;

ROLLBACK;
