-- Disable only the role escalation trigger
ALTER TABLE profiles DISABLE TRIGGER prevent_role_escalation_trigger;

UPDATE profiles SET is_premium = true, role = 'admin' WHERE email = 'evaldo0510@gmail.com';

-- Re-enable the trigger
ALTER TABLE profiles ENABLE TRIGGER prevent_role_escalation_trigger;