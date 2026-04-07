-- Disable trigger
ALTER TABLE public.profiles DISABLE TRIGGER profiles_security_enforcement;

-- Update role (using ID to be sure)
UPDATE public.profiles SET role = 'admin' WHERE id = 'b3ba21b5-85c1-4f6a-b9c7-7d6b4b3d1542';

-- Re-enable trigger
ALTER TABLE public.profiles ENABLE TRIGGER profiles_security_enforcement;