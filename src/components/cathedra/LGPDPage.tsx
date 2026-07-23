import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../constants';

/**
 * Página LGPD — descreve o cumprimento da Lei nº 13.709/2018.
 * Complementa a Política de Privacidade com foco nos direitos do titular
 * e nas bases legais utilizadas pela Cathedra.
 */
const LGPDPage: React.FC = () => (
  <div className="w-full max-w-3xl mx-auto space-y-spacing-2xl py-spacing-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
    <header className="space-y-spacing-md">
      <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/[0.02] rounded-premium-full border border-primary/10">
        <Icons.Shield className="w-spacing-md h-spacing-md text-primary" />
        <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">
          LGPD · Lei nº 13.709/2018
        </span>
      </div>
      <h1 className="text-premium-4xl md:text-premium-5xl font-serif font-bold text-foreground tracking-tight">
        Conformidade com a LGPD
      </h1>
      <p className="text-muted-foreground text-premium-lg">
        A Cathedra Digital trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados
        brasileira. Esta página resume nossas práticas; para o detalhamento completo consulte a{' '}
        <Link to="/legal/privacy" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </header>

    <Section title="1. Papéis e responsabilidades">
      <p>
        A Cathedra Digital atua como <strong>controladora</strong> dos dados que coleta diretamente dos
        usuários. Provedores de infraestrutura (autenticação, banco de dados, e-mail, pagamentos) atuam
        como <strong>operadores</strong> sob contrato.
      </p>
    </Section>

    <Section title="2. Bases legais utilizadas (art. 7º)">
      <ul className="list-disc pl-spacing-lg space-y-spacing-2xs">
        <li><strong>Consentimento</strong> — para envio de comunicações opcionais e cookies não essenciais.</li>
        <li><strong>Execução de contrato</strong> — para operar a conta, assinaturas PRO e pagamentos.</li>
        <li><strong>Obrigação legal e regulatória</strong> — retenção fiscal e de segurança.</li>
        <li><strong>Legítimo interesse</strong> — telemetria agregada, prevenção a fraude e segurança da plataforma.</li>
      </ul>
    </Section>

    <Section title="3. Direitos do titular (art. 18)">
      <p>Você pode, a qualquer momento, solicitar:</p>
      <ul className="list-disc pl-spacing-lg space-y-spacing-2xs">
        <li>Confirmação da existência de tratamento;</li>
        <li>Acesso aos dados;</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
        <li>Portabilidade;</li>
        <li>Eliminação dos dados tratados com base no consentimento;</li>
        <li>Informação sobre compartilhamentos;</li>
        <li>Revogação do consentimento.</li>
      </ul>
    </Section>

    <Section title="4. Encarregado (DPO)">
      <p>
        Para exercer seus direitos ou tirar dúvidas sobre proteção de dados, fale com nosso encarregado
        pelo canal oficial da{' '}
        <Link to="/contato" className="text-primary hover:underline">página de contato</Link>. Respondemos
        em até 15 dias corridos, conforme recomendação da ANPD.
      </p>
    </Section>

    <Section title="5. Incidentes de segurança">
      <p>
        Em caso de incidente que possa acarretar risco relevante aos titulares, a Cathedra comunica a
        ANPD e os titulares afetados em prazo razoável, informando a natureza dos dados envolvidos,
        os riscos e as medidas adotadas para reverter ou mitigar os efeitos.
      </p>
    </Section>

    <Section title="6. Transferência internacional">
      <p>
        Alguns operadores contratados podem processar dados fora do Brasil (ex.: infraestrutura de nuvem).
        Nesses casos, exigimos garantias contratuais e técnicas equivalentes às previstas na LGPD.
      </p>
    </Section>

    <div className="pt-spacing-lg flex flex-wrap gap-spacing-sm">
      <Link
        to="/legal"
        className="px-spacing-md py-spacing-xs text-premium-sm font-medium text-primary hover:underline"
      >
        ← Voltar ao Centro Legal
      </Link>
      <Link
        to="/legal/privacy"
        className="px-spacing-md py-spacing-xs text-premium-sm font-medium text-primary hover:underline"
      >
        Ver Política de Privacidade completa →
      </Link>
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-spacing-sm text-muted-foreground leading-relaxed">
    <h2 className="text-premium-xl font-serif font-bold text-foreground">{title}</h2>
    <div className="space-y-spacing-sm text-premium-base">{children}</div>
  </section>
);

export default LGPDPage;
