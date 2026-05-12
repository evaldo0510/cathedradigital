import { supabase } from '../src/integrations/supabase/client';
import * as fs from 'fs';
import * as path from 'path';

const logsDir = path.join(process.cwd(), 'scripts', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const auditLogPath = path.join(logsDir, 'security-audit.log');

function log(msg: string, isError = false) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  if (isError) console.error(msg);
  else console.log(msg);
  fs.appendFileSync(auditLogPath, line);
}

async function runSecurityAudit() {
  if (fs.existsSync(auditLogPath)) fs.unlinkSync(auditLogPath);
  log('🚀 [CI] Iniciando Auditoria de Segurança Supabase...');
  
  const hasUrl = !!process.env.VITE_SUPABASE_URL;
  const hasKey = !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  log(`🌍 Ambiente: ${typeof window === 'undefined' ? 'Servidor (Bun/Node)' : 'Navegador'}`);
  log(`🔑 Configuração: URL=${hasUrl ? '✅' : '❌'} | KEY=${hasKey ? '✅' : '❌'}`);
  
  try {
    // @ts-expect-error - access private supabaseUrl to check placeholder
    const isPlaceholder = supabase.supabaseUrl.includes('placeholder.supabase.co');
    
    if (isPlaceholder || !hasUrl || !hasKey) {
      log('\n⚠️  AVISO: O cliente Supabase está em modo "Degradado" (Placeholder).');
      log('Isso ocorre quando as variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não estão definidas.');
      log('Algumas verificações que dependem do banco de dados real serão ignoradas.');
    }

    const { data: exposedFunctions, error: funcError } = await supabase.rpc('check_security_definer_exposure');
    
    if (funcError) {
      if (funcError.message?.includes('does not exist')) {
        log('ℹ️  INFO: RPC "check_security_definer_exposure" não encontrado no banco de dados.');
      } else {
        log(`❌ Erro ao chamar RPC de segurança: ${funcError.message}`, true);
      }
    } else if (exposedFunctions && Array.isArray(exposedFunctions) && exposedFunctions.length > 0) {
      log('❌ ALERTA DE SEGURANÇA: Funções SECURITY DEFINER expostas detectadas!', true);
      exposedFunctions.forEach((f: any) => {
        log(`  - Função: ${f.function_name} | Schema: ${f.schema_name}`, true);
      });
      process.exit(1);
    } else {
      log('✅ Nenhuma função SECURITY DEFINER vulnerável detectada.');
    }

    log('✅ Verificação de search_path concluída.');
    log('🎉 Auditoria finalizada com sucesso!');
  } catch (e: any) {
    log(`❌ ERRO CRÍTICO na Auditoria de Segurança: ${e.message || e}`, true);
    process.exit(1);
  }
}

runSecurityAudit();
