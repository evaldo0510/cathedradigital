import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons, Logo } from '../../constants';
import { AppRoute } from '../../types';

const DIOCESES_BR = [
  'Arquidiocese de São Paulo',
  'Arquidiocese do Rio de Janeiro',
  'Arquidiocese de Brasília',
  'Arquidiocese de Belo Horizonte',
  'Arquidiocese de Salvador',
  'Arquidiocese de Fortaleza',
  'Arquidiocese de Porto Alegre',
  'Arquidiocese de Curitiba',
  'Arquidiocese de Recife e Olinda',
  'Arquidiocese de Goiânia',
  'Arquidiocese de Belém do Pará',
  'Arquidiocese de Manaus',
  'Arquidiocese de Campinas',
  'Arquidiocese de Florianópolis',
  'Arquidiocese de Vitória',
  'Arquidiocese de Natal',
  'Arquidiocese de São Luís do Maranhão',
  'Arquidiocese de Aparecida',
  'Diocese de Santos',
  'Diocese de Joinville',
  'Diocese de Caxias do Sul',
  'Diocese de Juiz de Fora',
  'Diocese de Uberlândia',
  'Diocese de Maringá',
  'Diocese de Londrina',
];

const DIOCESE_URLS: Record<string, string> = {
  'Arquidiocese de São Paulo': 'https://www.arquisp.org.br',
  'Arquidiocese do Rio de Janeiro': 'https://arqrio.org',
  'Arquidiocese de Brasília': 'https://www.arquidiocesedebrasilia.org.br',
  'Arquidiocese de Belo Horizonte': 'https://www.arquidiocesebh.org.br',
  'Arquidiocese de Salvador': 'https://www.arquidiocesesalvador.org.br',
  'Arquidiocese de Fortaleza': 'https://www.arquidiocesedefortaleza.org.br',
  'Arquidiocese de Porto Alegre': 'https://www.arquidiocesepoa.org.br',
  'Arquidiocese de Curitiba': 'https://www.arquidiocesedecuritiba.org.br',
  'Arquidiocese de Recife e Olinda': 'https://www.arquidioceseolindarecife.org',
  'Arquidiocese de Goiânia': 'https://www.arquidiocesedegoiania.org.br',
  'Arquidiocese de Belém do Pará': 'https://www.arquidiocesedebelem.com.br',
  'Arquidiocese de Manaus': 'https://www.arquidiocesdemanaus.org.br',
  'Arquidiocese de Campinas': 'https://www.arquidiocesecampinas.com',
  'Arquidiocese de Florianópolis': 'https://www.arquifln.org.br',
  'Arquidiocese de Vitória': 'https://www.aves.org.br',
  'Arquidiocese de Natal': 'https://www.arquidiocesedenatal.org.br',
  'Arquidiocese de São Luís do Maranhão': 'https://www.arquidiocesesaoluis.org.br',
  'Arquidiocese de Aparecida': 'https://www.arquidiocesedeaparecida.org.br',
};

const Footer: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const [selectedDiocese, setSelectedDiocese] = useState(() => localStorage.getItem('cathedra_diocese') || '');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vaticanLinks = [
    { title: 'Santa Sé', url: 'https://www.vatican.va' },
    { title: 'Catecismo', url: 'https://www.vatican.va/archive/ccc/index_po.htm' },
    { title: 'Vatican News', url: 'https://www.vaticannews.va/pt.html' },
    { title: 'Dicastérios', url: 'https://www.vatican.va/content/romancuria/pt.html' },
  ];

  const cnbbLinks = [
    { title: 'CNBB', url: 'https://www.cnbb.org.br' },
    { title: 'Liturgia Diária', url: 'https://www.cnbb.org.br/liturgia' },
    { title: 'Documentos', url: 'https://www.cnbb.org.br/category/publicacoes' },
  ];

  const scrollToTop = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`E-mail ${email} cadastrado com sucesso!`);
    setEmail('');
    setIsSubmitting(false);
  };

  const handleDioceseChange = (val: string) => {
    setSelectedDiocese(val);
    if (val) localStorage.setItem('cathedra_diocese', val);
    else localStorage.removeItem('cathedra_diocese');
  };

  const dioceseUrl = DIOCESE_URLS[selectedDiocese];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-xl border-t border-primary/10 pt-10 pb-10 px-6 md:px-12 pointer-events-auto hidden lg:block">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          
          {/* Logo & Info */}
          <div className="flex items-center gap-6">
            <Logo className="w-14 h-14 border border-primary/20 p-3 rounded-2xl bg-primary/5" />
            <div>
              <h3 className="text-2xl font-serif font-bold text-foreground tracking-tight">CATHEDRA</h3>
              <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Digital Sanctuarium</p>
            </div>
          </div>

          {/* Essential Links */}
          <nav className="flex items-center gap-10">
            {[{ label: 'Bíblia', route: AppRoute.BIBLE }, { label: 'Catecismo', route: AppRoute.CATECHISM }, { label: 'Orações', route: AppRoute.ORACAO }, { label: 'Sobre', route: AppRoute.ABOUT }].map(item => (
              <button 
                key={item.label} 
                onClick={() => navigate(item.route)} 
                className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Social & Scroll */}
          <div className="flex items-center gap-6">
            <div className="flex gap-3">
              {[
                { icon: <Icons.Instagram className="w-5 h-5" />, url: 'https://instagram.com' },
                { icon: <Icons.Youtube className="w-5 h-5" />, url: 'https://youtube.com' },
                { icon: <Icons.Whatsapp className="w-5 h-5" />, url: 'https://wa.me' },
              ].map((social, i) => (
                <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-all p-2 rounded-xl bg-foreground/5 border border-foreground/10">
                  {social.icon}
                </a>
              ))}
            </div>
            <button 
              onClick={scrollToTop}
              className="p-3 bg-primary text-black rounded-xl hover:scale-110 transition-all shadow-lg shadow-primary/20"
            >
              <Icons.ArrowDown className="w-5 h-5 rotate-180" />
            </button>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-foreground/5 flex justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
            © {new Date().getFullYear()} CATHEDRA • OMNIA AD MAIOREM DEI GLORIAM
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;