
-- RLS Regression Tests
BEGIN;

-- Setup test user IDs
-- test_user: 00000000-0000-0000-0000-000000000001
-- test_admin: 00000000-0000-0000-0000-000000000002

-- Insert test admin role
INSERT INTO public.user_roles (user_id, role) 
VALUES ('00000000-0000-0000-0000-000000000002', 'admin')
ON CONFLICT DO NOTHING;

-- Test theme_contents as non-admin
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
EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN 
        -- Success: insufficient_privilege
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

-- Test analytics_events as owner
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';
DO $$
BEGIN
    INSERT INTO analytics_events (user_id, event_name) VALUES ('00000000-0000-0000-0000-000000000001', 'test_event');
    -- Should succeed
END $$;

-- Should NOT be able to insert for other user
DO $$
BEGIN
    INSERT INTO analytics_events (user_id, event_name) VALUES ('00000000-0000-0000-0000-000000000002', 'other_event');
    RAISE EXCEPTION 'RLS FAIL: user should NOT be able to INSERT analytics for another user';
EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN 
        -- Success
    ELSE
        RAISE EXCEPTION 'RLS FAIL: unexpected error on analytics_events INSERT: % (%)', SQLERRM, SQLSTATE;
    END IF;
END $$;

-- Cleanup
ROLLBACK;
