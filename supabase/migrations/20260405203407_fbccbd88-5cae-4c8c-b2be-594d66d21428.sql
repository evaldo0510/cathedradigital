ALTER TABLE profiles DISABLE TRIGGER prevent_role_escalation_trigger;
ALTER TABLE profiles DISABLE TRIGGER profiles_prevent_escalation;

UPDATE profiles SET is_premium = true, role = 'admin' WHERE email = 'evaldo0510@gmail.com';

ALTER TABLE profiles ENABLE TRIGGER prevent_role_escalation_trigger;
ALTER TABLE profiles ENABLE TRIGGER profiles_prevent_escalation;