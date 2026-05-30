
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
  const [scanMode, setScanMode] = useState<'static' | 'render'>('static');

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
          title: '', 
          description: '', 
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
      let doc: Document;

      if (scanMode === 'render') {
        // Dynamic Render Mode: use iframe to wait for JS execution
        doc = await performDynamicRender(path);
      } else {
        // Static Mode: fast fetch of the raw HTML
        const response = await fetch(path);
        const htmlText = await response.text();
        const parser = new DOMParser();
        doc = parser.parseFromString(htmlText, 'text/html');
      }
      
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

  const performDynamicRender = (path: string): Promise<Document> => {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = path;
      document.body.appendChild(iframe);

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout rendering page'));
      }, 15000); // 15s timeout for heavy pages

      const cleanup = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        clearTimeout(timeout);
      };

      iframe.onload = () => {
        // Wait a bit for React/Helmet to update the head
        setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              // Clone the document to avoid reference issues after iframe removal
              const docClone = document.implementation.createHTMLDocument();
              docClone.documentElement.innerHTML = iframeDoc.documentElement.innerHTML;
              cleanup();
              resolve(docClone);
            } else {
              cleanup();
              reject(new Error('Could not access iframe content'));
            }
          } catch (e) {
            cleanup();
            reject(e);
          }
        }, 2000); // Give 2s for JS to run and SEOHead to inject tags
      };
    });
  };

  const scanAll = async () => {
    setIsScanningAll(true);
    if (scanMode === 'render') {
      toast.info('Modo Renderização JS ativo. A varredura será mais lenta para processar os metadados dinâmicos.');
    }
    
    // Scan in sequence to avoid overloading with iframes
    for (const page of pages) {
      await scanRoute(page.path);
    }
    setIsScanningAll(false);
    toast.success('Varredura completa!');
  };

  const exportCSV = () => {
    const headers = ['Nome', 'Rota', 'Título', 'Descrição', 'Status', 'OG Title', 'OG Description', 'OG Image', 'Twitter Card', 'Canonical'];
    const rows = pages.map(p => [
      p.name,
      p.path,
      p.title,
      p.description,
      p.status,
      p.metaTags?.ogTitle || '',
      p.metaTags?.ogDescription || '',
      p.metaTags?.ogImage || '',
      p.metaTags?.twitterCard || '',
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

  const downloadHTML = (page: SEOPageData) => {
    const content = getMetaTagsCode(page);
    const fileName = `seo-tags-${page.name.toLowerCase().replace(/\s+/g, '-') || 'page'}.html`;
    const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Tags HTML baixadas!');
  };

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

  const getSocialTagsOnly = (page: SEOPageData, type: 'facebook' | 'twitter') => {
    const title = page.title || `${page.name} — Cathedra Digital`;
    const description = page.description || '';
    const image = page.metaTags?.ogImage || getDynamicImage(title, page.image);
    const url = `${BASE_URL}${page.path}`;

    if (type === 'facebook') {
      return `<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">`;
    }

    return `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${url}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">`;
  };

  return (
    <div className="min-h-screen bg-background py-spacing-2xl px-spacing-md sm:px-spacing-lg lg:px-spacing-xl">
      <SEOHead 
        title="Verificação de SEO e Metadados" 
        description="Painel de controle para auditoria e verificação de metadados, imagens Open Graph e Twitter Cards com suporte a cache dinâmico."
        path="/admin/seo-verify"
      />
      
      <div className="max-w-6xl mx-auto space-y-spacing-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-spacing-md">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-spacing-xs flex items-center gap-spacing-sm">
              <Search className="w-spacing-xl h-spacing-xl text-primary" />
              Auditoria de SEO & Social
            </h1>
            <p className="text-muted-foreground text-lg">
              Verifique a aparência, tags e cache das imagens Open Graph para cada rota principal.
            </p>
          </div>
          <div className="flex flex-wrap gap-spacing-xs">
            <Button variant="outline" size="sm" onClick={() => window.open(`https://search.google.com/test/rich-results`, '_blank')}>
              <Globe className="w-spacing-md h-spacing-md mr-spacing-xs" />
              Rich Results Test
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`https://developers.facebook.com/tools/debug/`, '_blank')}>
              <Facebook className="w-spacing-md h-spacing-md mr-spacing-xs" />
              FB Debugger
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 p-spacing-md rounded-sm border border-border/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-spacing-md">
          <div className="flex items-center gap-spacing-md">
            <div className="p-spacing-xs bg-primary/10 rounded-lg">
              <RefreshCcw className={`w-spacing-md h-spacing-md text-primary ${isScanningAll ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="font-medium">Auditoria de Rotas ({pages.length})</h3>
              <p className="text-sm text-muted-foreground">O cache de imagens é invalidado mensalmente.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-spacing-xs items-center">
            <div className="flex bg-muted rounded-lg p-spacing-2xs mr-spacing-xs border border-border/50">
              <Button 
                variant={scanMode === 'static' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-spacing-lg text-xs px-spacing-sm"
                onClick={() => setScanMode('static')}
              >
                Rápido (HTML)
              </Button>
              <Button 
                variant={scanMode === 'render' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-spacing-lg text-xs px-spacing-sm"
                onClick={() => setScanMode('render')}
              >
                Render (JS)
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={scanAll}
              disabled={isScanningAll || isLoadingSitemap}
            >
              {isScanningAll ? <Loader2 className="w-spacing-md h-spacing-md mr-spacing-xs animate-spin" /> : <Search className="w-spacing-md h-spacing-md mr-spacing-xs" />}
              Varrer Todas
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportCSV}
              disabled={pages.length === 0}
            >
              <Download className="w-spacing-md h-spacing-md mr-spacing-xs" />
              Exportar CSV
            </Button>
            <div className="h-spacing-xl w-[1px] bg-border mx-spacing-xs hidden md:block" />
            <Button 
              variant={activeTab === 'preview' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveTab('preview')}
            >
              <ImageIcon className="w-spacing-md h-spacing-md mr-spacing-xs" />
              Visualização
            </Button>
            <Button 
              variant={activeTab === 'tags' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveTab('tags')}
            >
              <Code className="w-spacing-md h-spacing-md mr-spacing-xs" />
              Tags HTML
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-spacing-2xl">
          {isLoadingSitemap ? (
            <div className="flex flex-col items-center justify-center py-spacing-3xl gap-spacing-md">
              <Loader2 className="w-spacing-xl h-spacing-xl text-primary animate-spin" />
              <p className="text-muted-foreground">Carregando rotas do sitemap...</p>
            </div>
          ) : pages.map((page) => (
            <div key={page.path} className="space-y-spacing-md">
              <div className="flex items-center justify-between px-spacing-xs">
                <div className="flex items-center gap-spacing-sm">
                  <h2 className="text-2xl font-serif font-bold">{page.name}</h2>
                  <Badge variant="outline" className="font-mono">{page.path}</Badge>
                  {page.status === 'ok' && <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Válido</Badge>}
                  {page.status === 'pending' && <Badge variant="secondary">Pendente</Badge>}
                  {page.status === 'missing' && <Badge variant="destructive">Incompleto</Badge>}
                  {page.status === 'scanning' && (
                    <Badge className="animate-pulse bg-primary/20 text-primary border-primary/30">
                      {scanMode === 'render' ? 'Renderizando...' : 'Varrendo...'}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-spacing-xs">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => scanRoute(page.path)}
                    disabled={page.status === 'scanning'}
                  >
                    <RefreshCcw className={`w-spacing-sm h-spacing-sm mr-spacing-xs ${page.status === 'scanning' ? 'animate-spin' : ''}`} />
                    Scan
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`${BASE_URL}${page.path}`, '_blank')}>
                    <ExternalLink className="w-spacing-md h-spacing-md" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${BASE_URL}${page.path}`, 'Link')} title="Copiar Link">
                    <Copy className="w-spacing-md h-spacing-md" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(getMetaTagsCode(page), 'Tags HTML')} title="Copiar Tags HTML">
                    <Code className="w-spacing-md h-spacing-md" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadHTML(page)} title="Baixar Tags HTML">
                    <Download className="w-spacing-md h-spacing-md" />
                  </Button>
                </div>
              </div>

              {activeTab === 'preview' ? (
                <Card className="overflow-hidden border-border/50 shadow-premium">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Left Side: Metadata & Search Previews */}
                      <div className="p-spacing-lg space-y-spacing-lg border-r border-border/50">
                        <div className="space-y-spacing-md">
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-spacing-2xs">Google Search Preview</div>
                            <div className="p-spacing-md bg-white dark:bg-[#1a1a1a] rounded-lg border border-border/40 shadow-md">
                              <div className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] mb-spacing-2xs flex items-center gap-spacing-2xs">
                                {BASE_URL.replace('https://', '')} <span className="text-[10px]">▼</span>
                              </div>
                              <div className="text-[20px] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-tight mb-spacing-2xs">
                                {page.title || 'Título não detectado'} — Cathedra Digital
                              </div>
                              <div className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2">
                                {page.description || 'Descrição não detectada. Execute o Scan para ler os metadados reais da página.'}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-spacing-md">
                            <div className="p-spacing-sm bg-muted/30 rounded-lg border border-border/30">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-spacing-2xs">Title Length</div>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-lg">{(page.title?.length || 0) + 18}</span>
                                {(page.title?.length || 0) + 18 <= 60 && (page.title?.length || 0) > 0 ? (
                                  <CheckCircle2 className="w-spacing-md h-spacing-md text-green-500" />
                                ) : (
                                  <AlertCircle className="w-spacing-md h-spacing-md text-amber-500" />
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-spacing-2xs">Ideal: 50-60 chars</div>
                            </div>
                            <div className="p-spacing-sm bg-muted/30 rounded-lg border border-border/30">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-spacing-2xs">Desc Length</div>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-lg">{page.description?.length || 0}</span>
                                {(page.description?.length || 0) <= 160 && (page.description?.length || 0) >= 120 ? (
                                  <CheckCircle2 className="w-spacing-md h-spacing-md text-green-500" />
                                ) : (
                                  <AlertCircle className="w-spacing-md h-spacing-md text-amber-500" />
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-spacing-2xs">Ideal: 120-160 chars</div>
                            </div>
                          </div>
                          
                          {(page.status === 'missing' || !page.title || !page.description) && (
                            <div className="p-spacing-md bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-spacing-xs flex items-center gap-spacing-xs">
                                <AlertCircle className="w-spacing-sm h-spacing-sm" /> Sugestões de Melhoria
                              </h4>
                              <ul className="text-[11px] text-amber-800 dark:text-amber-300 space-y-spacing-2xs list-disc pl-spacing-md">
                                {!page.title && <li>O título está ausente. Use o componente SEOHead para definir um título único.</li>}
                                {page.title && (page.title.length + 18) > 60 && <li>O título está muito longo e será cortado no Google. Reduza para menos de 60 caracteres.</li>}
                                {!page.description && <li>A descrição está ausente. Adicione uma meta descrição de 120-160 caracteres para melhorar o CTR.</li>}
                                {page.description && page.description.length < 120 && <li>A descrição está curta demais. Tente ser mais persuasivo.</li>}
                                {!page.metaTags?.ogImage && <li>Imagem Open Graph não detectada. Redes sociais usarão o fallback padrão.</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Social Media Previews */}
                      <div className="p-spacing-lg bg-muted/10 space-y-spacing-xl">
                        <div>
                          <div className="flex items-center justify-between mb-spacing-xs">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-spacing-2xs">
                              <Share2 className="w-spacing-sm h-spacing-sm" /> Facebook / WhatsApp
                            </div>
                            <Button 
                              variant="ghost" 
                              size="xs" 
                              className="h-spacing-lg px-spacing-xs text-[10px] gap-spacing-2xs"
                              onClick={() => copyToClipboard(getSocialTagsOnly(page, 'facebook'), 'Tags Facebook')}
                            >
                              <Copy className="w-spacing-sm h-spacing-sm" /> Copiar Tags
                            </Button>
                          </div>
                          <div className="border border-border/50 rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-premium">
                            <div className="aspect-[1.91/1] relative group">
                              <img 
                                src={page.metaTags?.ogImage || getDynamicImage(page.title, page.image)} 
                                alt="OG Preview" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-spacing-xs right-spacing-xs flex gap-spacing-2xs">
                                <Button size="icon" variant="secondary" className="h-spacing-lg w-spacing-lg rounded-full opacity-80" onClick={() => window.open(page.metaTags?.ogImage || getDynamicImage(page.title, page.image), '_blank')}>
                                  <ImageIcon className="h-spacing-sm w-spacing-sm" />
                                </Button>
                              </div>
                            </div>
                            <div className="p-spacing-sm border-t border-border/50 bg-[#f2f3f5] dark:bg-[#242526]">
                              <div className="text-[11px] text-muted-foreground uppercase truncate tracking-tight">CATHEDRADIGITAL.COM.BR</div>
                              <div className="text-sm font-bold truncate mt-spacing-3xs">{page.title || page.name} — Cathedra Digital</div>
                              <div className="text-xs text-muted-foreground line-clamp-1 mt-spacing-3xs">{page.description || 'Descrição não disponível'}</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-spacing-xs">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-spacing-xs flex items-center gap-spacing-2xs">
                              <Twitter className="w-spacing-sm h-spacing-sm" /> Twitter Card (Large)
                            </div>
                            <Button 
                              variant="ghost" 
                              size="xs" 
                              className="h-spacing-lg px-spacing-xs text-[10px] gap-spacing-2xs"
                              onClick={() => copyToClipboard(getSocialTagsOnly(page, 'twitter'), 'Tags Twitter')}
                            >
                              <Copy className="w-spacing-sm h-spacing-sm" /> Copiar Tags
                            </Button>
                          </div>
                          <div className="border border-border/40 rounded-premium overflow-hidden bg-white dark:bg-[#15202b] shadow-md">
                            <div className="aspect-[1.91/1] bg-muted">
                              <img 
                                src={page.metaTags?.ogImage || getDynamicImage(page.title, page.image)} 
                                alt="Twitter Preview" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-spacing-sm border-t border-border/20">
                              <div className="text-sm font-bold truncate">{page.title || page.name}</div>
                              <div className="text-[13px] text-muted-foreground line-clamp-2 mt-spacing-3xs">{page.description || 'Descrição não disponível'}</div>
                              <div className="text-xs text-muted-foreground mt-spacing-2xs flex items-center">
                                <Globe className="w-spacing-sm h-spacing-sm mr-spacing-2xs opacity-50" />
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
                <Card className="border-border/50 shadow-premium">
                  <CardHeader className="pb-spacing-sm border-b border-border/50 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Generated HTML Tags</CardTitle>
                      <CardDescription className="text-xs">Paste these into your CMS or manual header if needed.</CardDescription>
                    </div>
                    <div className="flex gap-spacing-xs">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(getMetaTagsCode(page), 'Tags HTML')}>
                        <Copy className="w-spacing-md h-spacing-md mr-spacing-xs" />
                        Copiar Código
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadHTML(page)}>
                        <Download className="w-spacing-md h-spacing-md mr-spacing-xs" />
                        Baixar HTML
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="p-spacing-lg bg-muted/40 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      {getMetaTagsCode(page)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>

        <div className="pt-spacing-2xl border-t border-border/50">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-spacing-xs">
                <AlertCircle className="w-spacing-md h-spacing-md text-primary" />
                Dicas de Otimização e Cache
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-spacing-md text-sm text-muted-foreground">
              <p>
                <strong>1. Cache de Imagem:</strong> As imagens dinâmicas utilizam o parâmetro <code>v=yyyy-mm</code>. Isso garante que as redes sociais não usem versões antigas por muito tempo, mas mantém a estabilidade durante o mês atual.
              </p>
              <p>
                <strong>2. Fallback Automático:</strong> O Cathedra Digital agora fornece múltiplos metatags <code>og:image</code>. Caso o serviço dinâmico falhe ou demore a responder, os crawlers automaticamente tentarão o segundo link (Imagem padrão da Home).
              </p>
              <p>
                <strong>3. Auditoria Real:</strong> Use o botão <strong>Scan</strong> para ler o HTML que está sendo servido atualmente para cada rota. Isso valida se o <code>react-helmet-async</code> está configurado corretamente para aquela página.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SEOVerificationPage;
