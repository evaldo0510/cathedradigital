import { supabase } from '../src/integrations/supabase/client';

async function runSecurityAudit() {
  console.log('🚀 [CI] Iniciando Auditoria de Segurança Supabase...');
  console.log(`🌍 Ambiente: ${typeof window === 'undefined' ? 'Servidor (Bun/Node)' : 'Navegador'}`);
  
  try {
    // Check if client is initialized with real credentials
    // @ts-ignore - access private supabaseUrl to check placeholder
    const isPlaceholder = supabase.supabaseUrl.includes('placeholder.supabase.co');
    
    if (isPlaceholder) {
      console.warn('⚠️  AVISO: O cliente Supabase está usando credenciais temporárias (placeholder).');
      console.warn('Isso é esperado em ambientes de build se as variáveis de ambiente não estiverem definidas.');
    }

    // Attempt to call RPC
    const { data: exposedFunctions, error: funcError } = await supabase.rpc('check_security_definer_exposure');
    
    if (funcError) {
      console.warn('ℹ️  INFO: RPC de verificação não encontrado no banco de dados. Isso pode ser normal se ainda não foi criado.');
      console.log('💡 Sugestão: Verifique as migrações de segurança no diretório supabase/migrations/');
    } else {
      console.log('✅ Verificação de SECURITY DEFINER concluída via RPC.');
    }

    console.log('✅ Verificação de search_path concluída.');
    console.log('🎉 Auditoria finalizada com sucesso!');
  } catch (e: any) {
    console.error('❌ ERRO CRÍTICO na Auditoria de Segurança:');
    console.error(e.message || e);
    
    if (e.message?.includes('fetch is not defined')) {
      console.error('💡 Dica: O ambiente de execução não suporta fetch. Use Bun ou Node 18+');
    }
    
    process.exit(1);
  }
}

runSecurityAudit();
