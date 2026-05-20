
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ImageIcon, 
  Search, 
  Share2, 
  Copy, 
  RefreshCcw,
  Globe,
  Twitter,
  Facebook,
  Code,
  Download,
  Loader2,
  FileText
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SEOPageData {
  name: string;
  path: string;
  title: string;
  description: string;
  image?: string;
  keywords?: string;
  status?: 'pending' | 'ok' | 'missing' | 'scanning';
  metaTags?: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    canonical?: string;
  };
}

const BASE_URL = 'https://www.cathedradigital.com.br';
const DEFAULT_OG_IMAGE = 'https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-home.png';

const SEOVerificationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'preview' | 'tags'>('preview');
  const [pages, setPages] = useState<SEOPageData[]>([]);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [isLoadingSitemap, setIsLoadingSitemap] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      setIsLoadingSitemap(true);
      const response = await fetch('/sitemap.xml');
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const locs = Array.from(xmlDoc.getElementsByTagName('loc'));
      
      const routes = locs.map(loc => {
        const url = loc.textContent || '';
        const path = url.replace(BASE_URL, '') || '/';
        const name = path === '/' ? 'Home' : path.substring(1).split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        return {
          name,
          path,
          title: '', // Will be filled by scan
          description: '', // Will be filled by scan
          status: 'pending' as const
        };
      });

      setPages(routes);
    } catch (error) {
      console.error('Error loading sitemap:', error);
      toast.error('Erro ao carregar sitemap.xml');
    } finally {
      setIsLoadingSitemap(false);
    }
  };

  const scanRoute = async (path: string) => {
    setPages(prev => prev.map(p => p.path === path ? { ...p, status: 'scanning' } : p));
    
    try {
      // Fetch the actual page content
      // Note: In an SPA, we fetch the path, which usually returns index.html
      // We are trying to read what's in the actual served HTML.
      const response = await fetch(path);
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      const title = doc.querySelector('title')?.textContent || '';
      const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
      
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
      const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      const twitterCard = doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
      const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';

      setPages(prev => prev.map(p => p.path === path ? { 
        ...p, 
        title, 
        description, 
        keywords,
        status: (title && description) ? 'ok' : 'missing',
        metaTags: {
          ogTitle,
          ogDescription,
          ogImage,
          twitterCard,
          canonical
        }
      } : p));

      return true;
    } catch (error) {
      console.error(`Error scanning route ${path}:`, error);
      setPages(prev => prev.map(p => p.path === path ? { ...p, status: 'missing' } : p));
      return false;
    }
  };

  const scanAll = async () => {
    setIsScanningAll(true);
    for (const page of pages) {
      await scanRoute(page.path);
    }
    setIsScanningAll(false);
    toast.success('Varredura completa!');
  };

  const exportCSV = () => {
    const headers = ['Nome', 'Rota', 'Título', 'Descrição', 'Status', 'OG Title', 'OG Description', 'OG Image', 'Canonical'];
    const rows = pages.map(p => [
      p.name,
      p.path,
      p.title,
      p.description,
      p.status,
      p.metaTags?.ogTitle || '',
      p.metaTags?.ogDescription || '',
      p.metaTags?.ogImage || '',
      p.metaTags?.canonical || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_seo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV exportado!');
  };

  const getDynamicImage = (title: string, customImage?: string) => {
    if (customImage) return customImage;
    const encodedTitle = encodeURIComponent(title || 'Cathedra Digital');
    const cacheKey = new Date().toISOString().split('T')[0].substring(0, 7); // yyyy-mm
    return `https://placehold.jp/40/1a1a1a/ffffff/1200x630.png?text=${encodedTitle}%0A%0ACathedra%20Digital&css=%7B%22font-family%22%3A%22serif%22%7D&v=${cacheKey}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const generateMetaTags = (page: SEOPageData) => {
    return getMetaTagsCode(page);
  };

  // Redefining generateMetaTags for the component scope
  const getMetaTagsCode = (page: SEOPageData) => {
    const title = page.title || `${page.name} — Cathedra Digital`;
    const description = page.description || '';
    const image = page.metaTags?.ogImage || getDynamicImage(title, page.image);
    const url = `${BASE_URL}${page.path}`;
    
    return `<!-- Basic Meta Tags -->
<title>${title}</title>
<meta name="description" content="${description}">
${page.keywords ? `<meta name="keywords" content="${page.keywords}">` : ''}
<link rel="canonical" href="${url}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${url}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">`;
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead 
        title="Verificação de SEO e Metadados" 
        description="Painel de controle para auditoria e verificação de metadados, imagens Open Graph e Twitter Cards com suporte a cache dinâmico."
        path="/admin/seo-verify"
      />
      
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
              <Search className="w-10 h-10 text-primary" />
              Auditoria de SEO & Social
            </h1>
            <p className="text-muted-foreground text-lg">
              Verifique a aparência, tags e cache das imagens Open Graph para cada rota.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`https://search.google.com/test/rich-results`, '_blank')}>
              <Globe className="w-4 h-4 mr-2" />
              Rich Results Test
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`https://developers.facebook.com/tools/debug/`, '_blank')}>
              <Facebook className="w-4 h-4 mr-2" />
              FB Debugger
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <RefreshCcw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Status do Cache Dinâmico</h3>
              <p className="text-sm text-muted-foreground">O cache de imagens é invalidado mensalmente (v={new Date().toISOString().substring(0, 7)}).</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={activeTab === 'preview' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveTab('preview')}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Visualização
            </Button>
            <Button 
              variant={activeTab === 'tags' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveTab('tags')}
            >
              <Code className="w-4 h-4 mr-2" />
              Tags HTML
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {SEO_PAGES.map((page) => (
            <div key={page.path} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif font-bold">{page.name}</h2>
                  <Badge variant="outline" className="font-mono">{page.path}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => window.open(`${BASE_URL}${page.path}`, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${BASE_URL}${page.path}`, 'Link')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {activeTab === 'preview' ? (
                <Card className="overflow-hidden border-border/50 shadow-lg">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Left Side: Metadata & Search Previews */}
                      <div className="p-6 space-y-6 border-r border-border/50">
                        <div className="space-y-4">
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Google Search Preview</div>
                            <div className="p-4 bg-white dark:bg-[#1a1a1a] rounded-lg border border-border/40 shadow-sm">
                              <div className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] mb-1 flex items-center gap-1">
                                {BASE_URL.replace('https://', '')} <span className="text-[10px]">▼</span>
                              </div>
                              <div className="text-[20px] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-tight mb-1">
                                {page.title} — Cathedra Digital
                              </div>
                              <div className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2">
                                {page.description}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Title Length</div>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-lg">{page.title.length + 18}</span>
                                {page.title.length + 18 <= 60 ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">Ideal: 50-60 chars</div>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Desc Length</div>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-lg">{page.description.length}</span>
                                {page.description.length <= 160 ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">Ideal: 120-160 chars</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Social Media Previews */}
                      <div className="p-6 bg-muted/10 space-y-8">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                              <Share2 className="w-3 h-3" /> Facebook / WhatsApp
                            </div>
                            <Badge variant="secondary" className="text-[9px]">Cache Active</Badge>
                          </div>
                          <div className="border border-border/50 rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-md">
                            <div className="aspect-[1.91/1] relative group">
                              <img 
                                src={getDynamicImage(page.title, page.image)} 
                                alt="OG Preview" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full opacity-80" onClick={() => window.open(getDynamicImage(page.title, page.image), '_blank')}>
                                  <ImageIcon className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="p-3 border-t border-border/50 bg-[#f2f3f5] dark:bg-[#242526]">
                              <div className="text-[11px] text-muted-foreground uppercase truncate tracking-tight">CATHEDRADIGITAL.COM.BR</div>
                              <div className="text-sm font-bold truncate mt-0.5">{page.title} — Cathedra Digital</div>
                              <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{page.description}</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Twitter className="w-3 h-3" /> Twitter Card (Large)
                          </div>
                          <div className="border border-border/40 rounded-2xl overflow-hidden bg-white dark:bg-[#15202b] shadow-sm">
                            <div className="aspect-[1.91/1] bg-muted">
                              <img 
                                src={getDynamicImage(page.title, page.image)} 
                                alt="Twitter Preview" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-3 border-t border-border/20">
                              <div className="text-sm font-bold truncate">{page.title}</div>
                              <div className="text-[13px] text-muted-foreground line-clamp-2 mt-0.5">{page.description}</div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                <Globe className="w-3 h-3 mr-1 opacity-50" />
                                cathedradigital.com.br
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 shadow-md">
                  <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Generated HTML Tags</CardTitle>
                      <CardDescription className="text-xs">Paste these into your CMS or manual header if needed.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(generateMetaTags(page), 'Tags HTML')}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Código
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="p-6 bg-muted/40 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      {generateMetaTags(page)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-border/50">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Dicas de Otimização e Cache
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>1. Cache de Imagem:</strong> As imagens dinâmicas utilizam o parâmetro <code>v=yyyy-mm</code>. Isso garante que as redes sociais não usem versões antigas por muito tempo, mas mantém a estabilidade durante o mês atual.
              </p>
              <p>
                <strong>2. Fallback Automático:</strong> O Cathedra Digital agora fornece múltiplos metatags <code>og:image</code>. Caso o serviço dinâmico falhe ou demore a responder, os crawlers automaticamente tentarão o segundo link (Imagem padrão da Home).
              </p>
              <p>
                <strong>3. Limpeza Manual:</strong> Se você alterou o título e a imagem não atualizou nas redes sociais, use o "Facebook Sharing Debugger" e clique em "Scrape Again".
              </p>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" size="sm" onClick={() => window.open('https://cards-dev.twitter.com/validator', '_blank')}>Twitter Validator</Button>
                <Button variant="outline" size="sm" onClick={() => window.open('https://www.linkedin.com/post-inspector/', '_blank')}>LinkedIn Inspector</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SEOVerificationPage;
