-- Atualizar descrições técnicas nos logs de segurança para português
UPDATE public.bible_audit_security_logs
SET summary = 'Verificação de integridade iniciada'
WHERE action = 'SCAN_RUN' AND summary IS NULL;

-- Atualizar metadados de ações passadas para refletir o novo glossário (exemplo)
UPDATE public.bible_audit_action_logs
SET action = 'Nova Política de Retentativa'
WHERE action = 'Update Notification Policy';
