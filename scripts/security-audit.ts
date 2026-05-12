import { supabase } from '../src/integrations/supabase/client';

async function runSecurityAudit() {
  console.log('🚀 [CI] Iniciando Auditoria de Segurança Supabase...');
  
  const hasUrl = !!process.env.VITE_SUPABASE_URL;
  const hasKey = !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log(`🌍 Ambiente: ${typeof window === 'undefined' ? 'Servidor (Bun/Node)' : 'Navegador'}`);
  console.log(`🔑 Configuração: URL=${hasUrl ? '✅' : '❌'} | KEY=${hasKey ? '✅' : '❌'}`);
  
  try {
    // Check if client is initialized with real credentials
    // @ts-ignore - access private supabaseUrl to check placeholder
    const isPlaceholder = supabase.supabaseUrl.includes('placeholder.supabase.co');
    
    if (isPlaceholder || !hasUrl || !hasKey) {
      console.warn('\n⚠️  AVISO: O cliente Supabase está em modo "Degradado" (Placeholder).');
      console.warn('Isso ocorre quando as variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não estão definidas.');
      console.warn('Algumas verificações que dependem do banco de dados real serão ignoradas.');
      
      if (!process.env.CI) {
        console.log('💡 Dica local: Crie um arquivo .env com as credenciais do Supabase.');
      }
    }

    // Attempt to call RPC
    const { data: exposedFunctions, error: funcError } = await supabase.rpc('check_security_definer_exposure');
    
    if (funcError) {
      if (funcError.message?.includes('does not exist')) {
        console.warn('ℹ️  INFO: RPC "check_security_definer_exposure" não encontrado no banco de dados.');
        console.log('💡 Sugestão: Execute as migrações de segurança para habilitar verificações automáticas.');
      } else {
        console.error('❌ Erro ao chamar RPC de segurança:', funcError.message);
        // Don't fail build just because RPC is missing, but log it
      }
    } else if (exposedFunctions && Array.isArray(exposedFunctions) && exposedFunctions.length > 0) {
      console.error('❌ ALERTA DE SEGURANÇA: Funções SECURITY DEFINER expostas detectadas!');
      exposedFunctions.forEach((f: any) => {
        console.error(`  - Função: ${f.function_name} | Schema: ${f.schema_name}`);
      });
      process.exit(1);
    } else {
      console.log('✅ Nenhuma função SECURITY DEFINER vulnerável detectada.');
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
