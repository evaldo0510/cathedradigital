import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import { ChevronLeft } from 'lucide-react';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full pb-spacing-4xl">
      {/* Redundant back button removed */}

      <h1 className="text-premium-3xl md:text-premium-4xl font-serif font-bold text-foreground mb-spacing-xs">Termos de Uso</h1>
      <p className="text-premium-xs font-black uppercase tracking-widest text-primary mb-spacing-xl">Última atualização: Abril de 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-spacing-xl text-muted-foreground">
        <section>
          <h2 className="text-premium-lg font-bold text-foreground">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar a plataforma Cathedra Digital, você concorda com estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            A Cathedra é uma plataforma dedicada ao estudo, oração e vivência da fé católica.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">2. Descrição dos Serviços</h2>
          <p>
            A Cathedra Digital oferece acesso a textos sagrados, documentos do Magistério, 
            ferramentas de oração, estudos bíblicos e catequéticos, e uma comunidade de formação. 
            Os conteúdos disponibilizados provêm de fontes oficiais da Igreja Católica e 
            são apresentados com fins educativos e devocionais.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">3. Conta de Usuário</h2>
          <p>
            Para acessar determinadas funcionalidades, é necessário criar uma conta. 
            Você é responsável por manter a confidencialidade de suas credenciais de acesso 
            e por todas as atividades realizadas sob sua conta. Notifique-nos imediatamente 
            em caso de uso não autorizado.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">4. Assinatura PRO</h2>
          <p>
            A assinatura PRO concede acesso a recursos avançados como o Colloquium IA e 
            ferramentas exclusivas de estudo. O pagamento é processado de forma segura e 
            pode ser cancelado a qualquer momento. Não há reembolso para períodos parciais 
            já utilizados.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">5. Propriedade Intelectual</h2>
          <p>
            Os textos bíblicos, catequéticos e magisteriais pertencem às suas respectivas fontes. 
            A interface, design, código e funcionalidades exclusivas da plataforma são propriedade 
            da Cathedra Digital. É proibida a reprodução não autorizada do conteúdo proprietário.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">6. Conduta do Usuário</h2>
          <p>
            O usuário compromete-se a utilizar a plataforma de forma respeitosa, em conformidade 
            com os valores cristãos e a doutrina católica. É expressamente proibido publicar 
            conteúdo ofensivo, difamatório ou contrário aos ensinamentos da Igreja nos espaços 
            comunitários da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">7. Limitação de Responsabilidade</h2>
          <p>
            A Cathedra Digital oferece seus serviços "como estão". Não garantimos a disponibilidade 
            ininterrupta do serviço nem a ausência total de erros. Os conteúdos não substituem 
            a orientação pastoral direta de um sacerdote ou diretor espiritual.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">8. Alterações nos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            As alterações serão comunicadas por meio da plataforma e entrarão em vigor 
            na data de publicação. O uso continuado após alterações constitui aceitação 
            dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-premium-lg font-bold text-foreground">9. Contato</h2>
          <p>
            Para dúvidas sobre estes Termos de Uso, entre em contato conosco 
            através da seção de suporte da plataforma ou pelo e-mail disponibilizado 
            na página Sobre.
          </p>
        </section>
      </div>

      <div className="mt-spacing-2xl pt-spacing-lg border-t border-border">
        <p className="text-premium-xs text-muted-foreground italic text-center">
          "Conhecereis a verdade, e a verdade vos libertará." — Jo 8,32
        </p>
      </div>
    </div>
  );
};

export default TermsPage;