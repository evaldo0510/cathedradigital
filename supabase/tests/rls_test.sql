
-- RLS Regression Tests
BEGIN;

-- Setup test users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_user') THEN
        CREATE ROLE test_user;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_admin') THEN
        CREATE ROLE test_admin;
    END IF;
END
$$;

-- Create a mock function for auth.uid() if it doesn't exist for the test session
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::uuid;
$$ LANGUAGE sql STABLE;

-- Create a mock function for auth_internal.has_role()
CREATE OR REPLACE FUNCTION auth_internal.has_role(uid uuid, r app_role) RETURNS boolean AS $$
BEGIN
    IF uid = '00000000-0000-0000-0000-000000000002'::uuid AND r = 'admin'::app_role THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- Test theme_contents
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Should be able to select (policy: true)
DO $$
BEGIN
    PERFORM * FROM theme_contents LIMIT 1;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'RLS FAIL: authenticated user should be able to SELECT from theme_contents. Error: %', SQLERRM;
END $$;

-- Should NOT be able to insert
DO $$
BEGIN
    INSERT INTO theme_contents (title, content_type, reference) VALUES ('Test', 'text', 'test');
    RAISE EXCEPTION 'RLS FAIL: authenticated user should NOT be able to INSERT into theme_contents';
EXCEPTION WHEN insufficient_privilege THEN
    -- Success
WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN -- insufficient_privilege
        -- Success
    ELSE
        RAISE EXCEPTION 'RLS FAIL: unexpected error on theme_contents INSERT: % (%)', SQLERRM, SQLSTATE;
    END IF;
END $$;

-- Test as admin
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';
DO $$
BEGIN
    INSERT INTO theme_contents (title, content_type, reference) VALUES ('Admin Test', 'text', 'admin-test');
    -- Should succeed
END $$;

-- Cleanup
ROLLBACK;
