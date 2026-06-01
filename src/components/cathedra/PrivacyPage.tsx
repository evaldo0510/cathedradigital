import { Icons } from '@/constants';
import React from 'react';
import { useNavigate } from 'react-router-dom';


const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full pb-spacing-4xl">
      {/* Redundant back button removed */}

      <h1 className="text-premium-3xl md:text-premium-4xl font-serif font-bold text-foreground mb-spacing-xs">Política de Privacidade</h1>
      <p className="text-premium-xs font-black uppercase tracking-widest text-primary mb-spacing-xl">Última atualização: Abril de 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-spacing-xl text-muted-foreground">
        <section>
          <h2 className="text-premium-lg font-bold text-foreground">1. Informações Coletadas</h2>
          <p>
            Coletamos informações que você nos fornece diretamente ao criar uma conta: nome, 
            endereço de e-mail e diocese (opcional). Também coletamos dados de uso como 
            progresso de leitura, favoritos e anotações pessoais para personalizar sua experiência.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">2. Uso das Informações</h2>
          <p>Utilizamos suas informações para:</p>
          <ul className="list-disc pl-spacing-lg space-y-spacing-2xs">
            <li>Fornecer e manter a plataforma funcionando</li>
            <li>Personalizar sua experiência de leitura e oração</li>
            <li>Acompanhar seu progresso e conquistas</li>
            <li>Enviar comunicações relevantes sobre a plataforma (com seu consentimento)</li>
            <li>Melhorar nossos serviços com base em padrões de uso anônimos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">3. Proteção de Dados</h2>
          <p>
            Sua privacidade é sagrada para nós. Implementamos medidas de segurança técnicas 
            e organizacionais para proteger seus dados pessoais contra acesso não autorizado, 
            alteração, divulgação ou destruição. Seus dados são armazenados em servidores 
            seguros com criptografia.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">4. Compartilhamento de Dados</h2>
          <p>
            Não vendemos, comercializamos ou transferimos suas informações pessoais 
            para terceiros. Compartilhamos dados apenas com provedores de serviço essenciais 
            para o funcionamento da plataforma (como processadores de pagamento para assinaturas PRO), 
            sempre sob acordos de confidencialidade rigorosos.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">5. Dados da Comunidade</h2>
          <p>
            Publicações nos espaços comunitários são visíveis para outros usuários autenticados. 
            Seu nome e avatar são exibidos junto às suas contribuições. Você pode editar ou 
            excluir suas publicações a qualquer momento.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">6. Cookies e Armazenamento Local</h2>
          <p>
            Utilizamos armazenamento local (localStorage) para salvar preferências como tema 
            (claro/escuro), diocese selecionada e progresso de onboarding. Não utilizamos cookies 
            de rastreamento de terceiros. Dados de sessão são gerenciados de forma segura para 
            manter sua autenticação.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">7. Seus Direitos</h2>
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-spacing-lg space-y-spacing-2xs">
            <li>Acessar seus dados pessoais armazenados</li>
            <li>Solicitar a correção de dados incorretos</li>
            <li>Solicitar a exclusão de sua conta e dados associados</li>
            <li>Exportar seus dados (anotações, favoritos, progresso)</li>
            <li>Revogar consentimento para comunicações a qualquer momento</li>
          </ul>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">8. Dados de Menores</h2>
          <p>
            A plataforma é destinada a maiores de 13 anos. Não coletamos intencionalmente 
            informações de menores de 13 anos sem consentimento parental. Se tomarmos 
            conhecimento de que coletamos dados de um menor sem consentimento, tomaremos 
            medidas para excluir essas informações.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">9. Alterações nesta Política</h2>
          <p>
            Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças 
            significativas por meio da plataforma. Recomendamos revisar esta política 
            regularmente.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">10. Contato</h2>
          <p>
            Para questões relacionadas à privacidade ou para exercer seus direitos, 
            entre em contato através da seção de suporte ou pelo e-mail disponibilizado 
            na página Sobre.
          </p>
        </section>
      </div>

      <div className="mt-spacing-2xl pt-spacing-lg border-t border-border">
        <p className="text-premium-xs text-muted-foreground italic text-center">
          "O Senhor é meu pastor, nada me faltará." — Sl 23,1
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;