-- Forçar a geração de alertas para o scan mais recente para validar o sistema
SELECT public.generate_security_scan_alerts('50a934f4-76c4-4a57-a12c-e0a112c9af6c');
