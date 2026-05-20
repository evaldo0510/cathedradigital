
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppRoute } from '@/types';
import { ExternalLink, CheckCircle2, AlertCircle, ImageIcon, Search, Share2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';

interface SEOPageData {
  name: string;
  path: string;
  title: string;
  description: string;
  image?: string;
  keywords?: string;
}

const SEO_PAGES: SEOPageData[] = [
  {
    name: "Home",
    path: "/",
    title: "Cathedra Digital | Portal de Espiritualidade Minimalista",
    description: "Aprofunde sua fé com a Sagrada Escritura, Catecismo e Magistério. Use a Logos IA para resumos teológicos e siga sua Leitura Diária com progresso persistente no portal espiritual inteligente.",
    image: "https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-home.png",
    keywords: "bíblia católica, catecismo online, magistério da igreja, leitura diária, logos ia, espiritualidade minimalista, portal católico premium"
  },
  {
    name: "Hoje (Leitura Diária)",
    path: "/hoje",
    title: "Sua Jornada de Hoje",
    description: "Leituras bíblicas, parágrafos do catecismo e ensinamentos dos santos selecionados para o seu crescimento espiritual hoje.",
    image: "https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-today.png"
  },
  {
    name: "Bíblia Sagrada",
    path: "/bible",
    title: "Bíblia Sagrada Online",
    description: "Leia a Bíblia Sagrada em diversas traduções. Estudo bíblico católico completo com referências cruzadas e comentários.",
    keywords: "bíblia online, bíblia católica, sagrada escritura, ler a bíblia, estudo bíblico"
  },
  {
    name: "Catecismo",
    path: "/catechism",
    title: "Catecismo da Igreja Católica",
    description: "Acesse o Catecismo da Igreja Católica online. Estude a doutrina católica organizada por partes, seções e parágrafos.",
    keywords: "catecismo online, catecismo da igreja católica, doutrina católica, CIC"
  },
  {
    name: "Magistério",
    path: "/magisterium",
    title: "Documentos do Magistério",
    description: "Explore encíclicas, cartas apostólicas e constituições conciliares da Igreja Católica.",
    keywords: "magistério, encíclicas, papas, concílio vaticano ii, documentos da igreja"
  },
  {
    name: "Vidas dos Santos",
    path: "/santos",
    title: "Vidas dos Santos - Exemplos de Santidade",
    description: "Conheça a história e os ensinamentos dos grandes santos da Igreja Católica. Inspiração para a vida cristã.",
    keywords: "santos católicos, vidas dos santos, hagiografia, santidade, exemplos de fé"
  },
  {
    name: "Dogmas da Fé",
    path: "/dogmas",
    title: "Dogmas da Fé Católica",
    description: "Estude os dogmas da fé católica com referências bíblicas, do catecismo e do magistério. Depositum Fidei completo.",
    keywords: "dogmas católicos, depositum fidei, doutrina da igreja, verdades de fé"
  }
];

const SEOVerificationPage = () => {
  const navigate = useNavigate();
  const BASE_URL = 'https://www.cathedradigital.com.br';

  const getDynamicImage = (title: string, customImage?: string) => {
    if (customImage) return customImage;
    const encodedTitle = encodeURIComponent(title);
    return `https://placehold.jp/32/1a1a1a/ffffff/1200x630.png?text=${encodedTitle}%0A%0ACathedra%20Digital`;
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead 
        title="Verificação de SEO e Metadados" 
        description="Painel de controle para auditoria e verificação de metadados, imagens Open Graph e Twitter Cards."
        path="/admin/seo-verify"
      />
      
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Auditoria de SEO</h1>
            <p className="text-muted-foreground text-lg">
              Verifique a aparência e os metadados das principais rotas da plataforma.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(`${BASE_URL}/sitemap.xml`, '_blank')}>
              <Search className="w-4 h-4 mr-2" />
              Sitemap.xml
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {SEO_PAGES.map((page) => (
            <Card key={page.path} className="overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{page.name}</CardTitle>
                    <Badge variant="secondary">{page.path}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`${BASE_URL}${page.path}`, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Abrir Rota
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Meta Title</label>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border/50 font-mono text-sm">
                      {page.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={page.title.length > 60 ? "text-amber-500" : "text-green-500"}>
                        {page.title.length} caracteres
                      </span>
                      {page.title.length > 60 && (
                        <span className="flex items-center text-amber-500">
                          <AlertCircle className="w-3 h-3 mr-1" /> Ideal: &lt; 60
                        </span>
                      )}
                      {page.title.length <= 60 && (
                        <span className="flex items-center text-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ótimo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Meta Description</label>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border/50 text-sm leading-relaxed">
                      {page.description}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={page.description.length > 160 ? "text-amber-500" : "text-green-500"}>
                        {page.description.length} caracteres
                      </span>
                      {page.description.length > 160 && (
                        <span className="flex items-center text-amber-500">
                          <AlertCircle className="w-3 h-3 mr-1" /> Ideal: &lt; 160
                        </span>
                      )}
                      {page.description.length <= 160 && (
                        <span className="flex items-center text-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ótimo
                        </span>
                      )}
                    </div>
                  </div>

                  {page.keywords && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Keywords</label>
                      <div className="flex flex-wrap gap-1">
                        {page.keywords.split(',').map(kw => (
                          <Badge key={kw} variant="outline" className="text-[10px] py-0">{kw.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4 border-t border-border/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Share2 className="w-3 h-3" /> Facebook / WhatsApp Preview
                      </div>
                      <div className="border border-border/50 rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a]">
                        <div className="aspect-[1.91/1] bg-muted flex items-center justify-center relative group">
                          <img 
                            src={getDynamicImage(page.title, page.image)} 
                            alt="OG Preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="sm" variant="secondary" onClick={() => window.open(getDynamicImage(page.title, page.image), '_blank')}>
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Ver Imagem
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 border-t border-border/50">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold truncate">CATHEDRADIGITAL.COM.BR</div>
                          <div className="text-sm font-bold truncate">{page.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{page.description}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Twitter Card Preview</label>
                    <div className="border border-border/50 rounded-2xl overflow-hidden bg-white dark:bg-[#15202b]">
                      <div className="aspect-[1.91/1] bg-muted">
                        <img 
                          src={getDynamicImage(page.title, page.image)} 
                          alt="Twitter Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{page.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{page.description}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            cathedradigital.com.br
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Google Search Preview</label>
                    <div className="p-4 bg-white dark:bg-[#1a1a1a] rounded-lg border border-border/50 shadow-sm space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-border/50">
                          <span className="text-[10px] font-bold text-primary">C</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium text-foreground">Cathedra Digital</span>
                          <span className="text-[10px] text-muted-foreground">{BASE_URL}{page.path}</span>
                        </div>
                      </div>
                      <div className="text-[18px] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-tight pt-1">
                        {page.title.length > 60 ? page.title.substring(0, 60) + '...' : page.title}
                      </div>
                      <div className="text-[13px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-snug">
                        {page.description}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SEOVerificationPage;
