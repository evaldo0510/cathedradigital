import { Icons } from '@/constants';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSEO, useKeywords, SEOSettings } from '@/hooks/useSEO';

import { Badge } from '@/components/ui/badge';

const AdminSeoTab: React.FC = () => {
  const navigate = useNavigate();
  const { data: seoSettings, refetch: refetchSEO } = useSEO();
  const { data: keywords, refetch: refetchKeywords } = useKeywords();
  
  const [formData, setFormData] = useState<Partial<SEOSettings>>({});
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [jsonMode, setJsonMode] = useState<'pretty' | 'minified'>('pretty');
  const [domVerified, setDomVerified] = useState<'pending' | 'ok' | 'fail'>('pending');

  useEffect(() => {
    if (seoSettings) {
      setFormData(seoSettings);
    }
  }, [seoSettings]);

  const handleSaveSEO = async () => {
    // NAP Validation
    if (!formData.business_name || !formData.business_address || (!formData.business_phone && !formData.business_whatsapp) || !formData.opening_hours) {
      toast.error('Erro de Validação NAP', {
        description: 'Todos os campos de SEO Local (Nome, Endereço, Telefone/Whats e Horários) são obrigatórios para garantir a indexação.'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('seo_settings')
        .upsert({
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Configurações de SEO atualizadas com sucesso!');
      refetchSEO();
    } catch (err: any) {
      toast.error('Erro ao salvar SEO: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJSONLD = () => {
    const json = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": formData.business_name || "Cathedra Digital",
      "telephone": formData.business_whatsapp || formData.business_phone || "—",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": formData.business_address || "—"
      },
      "openingHours": formData.opening_hours || "—"
    }, null, jsonMode === 'pretty' ? 2 : 0);
    
    navigator.clipboard.writeText(json);
    toast.success('Copiado para a área de transferência!');
  };

  const verifyDOM = async () => {
    setDomVerified('pending');
    try {
      // In a real browser we check document.head
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      let found = false;
      scripts.forEach(s => {
        if (s.textContent?.includes('LocalBusiness')) found = true;
      });
      
      if (found) {
        setDomVerified('ok');
        toast.success('DOM Validado: JSON-LD LocalBusiness detectado!');
      } else {
        setDomVerified('fail');
        toast.error('Erro na Validação: JSON-LD não encontrado no cabeçalho.');
      }
    } catch (e) {
      setDomVerified('fail');
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    try {
      const { error } = await supabase
        .from('site_keywords')
        .insert({ keyword: newKeyword.trim(), priority: 0 });

      if (error) throw error;
      setNewKeyword('');
      refetchKeywords();
      toast.success('Palavra-chave adicionada!');
    } catch (err: any) {
      toast.error('Erro ao adicionar palavra-chave: ' + err.message);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    try {
      const { error } = await supabase
        .from('site_keywords')
        .delete()
        .eq('id', id);

      if (error) throw error;
      refetchKeywords();
      toast.success('Palavra-chave removida');
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err.message);
    }
  };

  return (
    <div className="space-y-spacing-lg animate-in fade-in duration-500 pb-spacing-3xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-lg">
        <div className="md:col-span-2 space-y-spacing-lg">
          <Card className="border-border/50 shadow-premium-md overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-spacing-md">
                <div className="flex items-center gap-spacing-xs text-primary">
                  <Icons.Globe className="w-spacing-md h-spacing-md" />
                  <div>
                    <CardTitle className="text-premium-lg font-serif">Configurações Técnicas de SEO</CardTitle>
                    <CardDescription>Gerencie meta tags, títulos e indexação global.</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-premium-full gap-spacing-xs border-primary/20 hover:bg-primary/5"
                  onClick={() => navigate(AppRoute.SEO_VERIFY)}
                >
                  <Icons.Eye className="w-spacing-md h-spacing-md" />
                  Auditoria de Metadados
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-spacing-lg space-y-spacing-lg">
              <div className="grid grid-cols-1 gap-spacing-lg">
                <div className="space-y-spacing-xs">
                  <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70">Título Base do Site (Google Title)</Label>
                  <Input 
                    value={formData.site_title || ''} 
                    onChange={e => setFormData({...formData, site_title: e.target.value})}
                    placeholder="Ex: Cathedra Digital — Bíblia e Tradição"
                  />
                  <p className="text-premium-xs text-muted-foreground italic">Recomendado: 50-60 caracteres.</p>
                </div>

                <div className="space-y-spacing-xs">
                  <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70">Meta Description Global</Label>
                  <Textarea 
                    value={formData.site_description || ''} 
                    onChange={e => setFormData({...formData, site_description: e.target.value})}
                    placeholder="Descrição que aparecerá no Google..."
                    rows={3}
                  />
                  <p className="text-premium-xs text-muted-foreground italic">Recomendado: 150-160 caracteres.</p>
                </div>

                <div className="space-y-spacing-md pt-spacing-lg border-t border-border/50">
                  <h4 className="text-premium-sm font-serif font-bold text-primary flex items-center gap-spacing-xs">
                    <Icons.MapPin className="w-spacing-md h-spacing-md" /> SEO Local & NAP
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
                    <div className="space-y-spacing-xs">
                      <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70">Nome do Negócio</Label>
                      <Input 
                        value={formData.business_name || ''} 
                        onChange={e => setFormData({...formData, business_name: e.target.value})}
                        placeholder="Ex: Cathedra Digital HQ"
                      />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70">Email de Contato</Label>
                      <Input 
                        value={formData.business_email || ''} 
                        onChange={e => setFormData({...formData, business_email: e.target.value})}
                        placeholder="contato@cathedra.com"
                      />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70">Endereço Físico</Label>
                      <Input 
                        value={formData.business_address || ''} 
                        onChange={e => setFormData({...formData, business_address: e.target.value})}
                        placeholder="Rua Exemplo, 123 - São Paulo"
                      />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70">Horário de Funcionamento</Label>
                      <Input 
                        value={formData.opening_hours || ''} 
                        onChange={e => setFormData({...formData, opening_hours: e.target.value})}
                        placeholder="Seg-Sex 08:00-18:00"
                      />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70">WhatsApp / Telefone</Label>
                      <Input 
                        value={formData.business_whatsapp || ''} 
                        onChange={e => setFormData({...formData, business_whatsapp: e.target.value})}
                        placeholder="+55 11 99999-9999"
                      />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70">Google Maps URL</Label>
                      <Input 
                        value={formData.google_maps_url || ''} 
                        onChange={e => setFormData({...formData, google_maps_url: e.target.value})}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md pt-spacing-lg border-t border-border/50">
                  <div className="space-y-spacing-xs">
                    <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70 flex items-center gap-spacing-2xs">
                      <Icons.Search className="w-spacing-sm h-spacing-sm" /> GSC Verification Code
                    </Label>
                    <Input 
                      value={formData.gsc_verification_code || ''} 
                      onChange={e => setFormData({...formData, gsc_verification_code: e.target.value})}
                      placeholder="Código da meta tag google-site-verification"
                    />
                  </div>
                  <div className="space-y-spacing-xs">
                    <Label className="text-premium-xs font-black uppercase tracking-widest opacity-70 flex items-center gap-spacing-2xs">
                      <Icons.LineChart className="w-spacing-sm h-spacing-sm" /> GA4 Measurement ID
                    </Label>
                    <Input 
                      value={formData.ga4_measurement_id || ''} 
                      onChange={e => setFormData({...formData, ga4_measurement_id: e.target.value})}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-spacing-md">
                <Button 
                  onClick={handleSaveSEO} 
                  disabled={loading}
                  className="rounded-premium-full bg-primary px-spacing-xl"
                >
                  <Icons.Save className="w-spacing-md h-spacing-md mr-spacing-xs" /> Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-premium-md">
            <CardHeader>
              <CardTitle className="text-premium-lg font-serif">Simulação de Google Snippet</CardTitle>
              <CardDescription>Como seu site aparece nos resultados de busca.</CardDescription>
            </CardHeader>
            <CardContent className="p-spacing-lg">
              <div className="bg-background border border-border/50 rounded-premium p-spacing-lg shadow-premium-md space-y-spacing-xs">
                <div className="flex items-center gap-spacing-xs mb-spacing-2xs">
                  <div className="w-spacing-md h-spacing-md bg-muted rounded-premium flex items-center justify-center overflow-hidden">
                    <Icons.Globe className="w-spacing-sm h-spacing-sm text-muted-foreground" />
                  </div>
                  <div className="text-premium-small text-[#202124]">
                    cathedradigital.lovable.app
                  </div>
                </div>
                <h3 className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer leading-tight">
                  {formData.site_title || 'Cathedra Digital — Bíblia e Tradição'}
                </h3>
                <p className="text-[14px] text-[#4d5156] leading-relaxed line-clamp-spacing-xs">
                  {formData.site_description || 'Aprofunde sua fé católica com Bíblia Sagrada, Catecismo da Igreja e IA teológica.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-spacing-lg">
          <Card className="border-border/50 shadow-premium-md h-fit">
            <CardHeader className="bg-muted/10 border-b border-border/50">
              <CardTitle className="text-md font-serif flex items-center gap-spacing-xs">
                <Icons.LineChart className="w-spacing-md h-spacing-md text-primary" /> GA4 Debug Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-spacing-md space-y-spacing-sm">
              <div className="flex items-center justify-between text-premium-xs">
                <span>Measurement ID:</span>
                <Badge variant="outline" className="font-mono">{formData.ga4_measurement_id || 'Não configurado'}</Badge>
              </div>
              <div className="flex items-center justify-between text-premium-xs">
                <span>Script Status:</span>
                {(typeof window !== 'undefined' && (window as any).gtag) ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-spacing-2xs">
                    <Icons.CheckCircle2 className="w-spacing-sm h-spacing-sm" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 gap-spacing-2xs">
                    <Icons.XCircle className="w-spacing-sm h-spacing-sm" /> Inativo
                  </Badge>
                )}
              </div>
              <div className="pt-spacing-xs space-y-spacing-xs border-t border-border/50">
                <p className="text-premium-xs font-black uppercase tracking-widest opacity-60">Rastreamento Ativo:</p>
                <div className="grid grid-cols-2 gap-spacing-xs">
                  {['Page Views', 'Clicks', 'Submits', 'Session'].map(ev => (
                    <div key={ev} className="flex items-center gap-spacing-2xs text-premium-xs font-medium">
                      <div className={`w-spacing-2xs h-spacing-2xs rounded-premium-full ${(window as any).gtag ? 'bg-emerald-500' : 'bg-muted'}`} />
                      {ev}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-premium-md h-fit">
            <CardHeader className="bg-amber-500/5 border-b border-border/50">
              <CardTitle className="text-md font-serif flex items-center gap-spacing-xs">
                <Icons.MapPin className="w-spacing-md h-spacing-md text-amber-600" /> Validação NAP & Local SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-spacing-md space-y-spacing-md">
              <div className="space-y-spacing-xs">
                <div className="flex items-center justify-between text-premium-xs font-black uppercase tracking-widest opacity-60">
                  <span>NAP Status</span>
                  {formData.business_name && formData.business_address && (formData.business_phone || formData.business_whatsapp) && formData.opening_hours ? (
                    <span className="text-emerald-600 flex items-center gap-spacing-2xs"><Icons.CheckCircle2 className="w-spacing-sm h-spacing-sm" /> Válido</span>
                  ) : (
                    <span className="text-destructive flex items-center gap-spacing-2xs"><Icons.AlertCircle className="w-spacing-sm h-spacing-sm" /> Incompleto</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-spacing-xs">
                  <Badge variant={formData.business_name ? "secondary" : "outline"} className="text-premium-xs h-spacing-md justify-start">Name: {formData.business_name ? 'OK' : 'Missing'}</Badge>
                  <Badge variant={formData.business_address ? "secondary" : "outline"} className="text-premium-xs h-spacing-md justify-start">Address: {formData.business_address ? 'OK' : 'Missing'}</Badge>
                  <Badge variant={formData.business_phone || formData.business_whatsapp ? "secondary" : "outline"} className="text-premium-xs h-spacing-md justify-start">Phone: {formData.business_phone || formData.business_whatsapp ? 'OK' : 'Missing'}</Badge>
                  <Badge variant={formData.opening_hours ? "secondary" : "outline"} className="text-premium-xs h-spacing-md justify-start">Hours: {formData.opening_hours ? 'OK' : 'Missing'}</Badge>
                </div>
              </div>

              <div className="space-y-spacing-sm">
                <div className="flex items-center justify-between">
                  <p className="text-premium-xs font-black uppercase tracking-widest opacity-60">Schema Preview:</p>
                  <div className="flex gap-spacing-xs">
                    <Button 
                      onClick={() => setJsonMode(jsonMode === 'pretty' ? 'minified' : 'pretty')}
                      className="text-premium-xs font-bold uppercase underline text-primary"
                    >
                      {jsonMode === 'pretty' ? 'Minificar' : 'Pretty Print'}
                    </Button>
                    <Button 
                      onClick={handleCopyJSONLD}
                      className="flex items-center gap-spacing-2xs text-premium-xs font-bold uppercase text-primary hover:bg-primary/5 p-spacing-2xs rounded"
                    >
                      <Icons.Copy className="w-spacing-xs h-spacing-xs" /> Copiar
                    </Button>
                  </div>
                </div>
                <div className="bg-black/90 text-amber-400 p-spacing-sm rounded-premium text-premium-xs font-mono overflow-x-auto max-h-[150px] no-scrollbar shadow-premium-md border border-amber-500/20">
                  <pre>
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": formData.business_name || "Cathedra Digital",
  "telephone": formData.business_whatsapp || formData.business_phone || "—",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": formData.business_address || "—"
  },
  "openingHours": formData.opening_hours || "—"
}, null, jsonMode === 'pretty' ? 2 : 0)}
                  </pre>
                </div>
              </div>

              <div className="pt-spacing-xs border-t border-border/50">
                <div className="flex items-center justify-between mb-spacing-xs">
                   <p className="text-premium-xs font-black uppercase tracking-widest opacity-60">DOM Verification:</p>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={verifyDOM}
                    className="h-spacing-lg text-premium-xs uppercase font-black"
                   >
                     <Icons.Eye className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Verificar no Site
                   </Button>
                </div>
                <div className={`p-spacing-xs rounded-premium-full border flex items-center justify-between ${
                  domVerified === 'ok' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 
                  domVerified === 'fail' ? 'bg-destructive/5 border-destructive/20 text-destructive' : 
                  'bg-muted/30 border-border/50 text-muted-foreground'
                }`}>
                  <span className="text-premium-xs font-bold">
                    {domVerified === 'pending' ? 'Aguardando verificação...' : 
                     domVerified === 'ok' ? 'JSON-LD Ativo no DOM' : 'JSON-LD Ausente ou Inválido'}
                  </span>
                  {domVerified === 'ok' && <Icons.Check className="w-spacing-sm h-spacing-sm" />}
                  {domVerified === 'fail' && <Icons.AlertCircle className="w-spacing-sm h-spacing-sm" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-premium-md h-fit">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="text-md font-serif flex items-center gap-spacing-xs">
                <Icons.Sparkles className="w-spacing-md h-spacing-md text-primary" /> IA SEO Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-spacing-md space-y-spacing-md">
              <div className="p-spacing-sm bg-muted/50 rounded-premium border border-border/50 text-premium-small leading-relaxed">
                <p className="font-bold text-primary mb-spacing-2xs">Dica Local:</p>
                "Adicionar o bairro ao endereço ajuda no posicionamento do Google Maps."
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-premium-md h-fit bg-muted/20">
            <CardContent className="p-spacing-md space-y-spacing-sm">
              <div className="flex items-center gap-spacing-xs text-premium-xs font-black uppercase tracking-widest text-primary">
                <Icons.Info className="w-spacing-sm h-spacing-sm" /> Links Úteis
              </div>
              <div className="space-y-spacing-xs">
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="flex items-center justify-between text-premium-xs hover:text-primary hover:underline group">
                  Search Console <Icons.ExternalLink className="w-spacing-sm h-spacing-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a href="/sitemap.xml" target="_blank" className="flex items-center justify-between text-premium-xs hover:text-primary hover:underline group">
                  Sitemap XML <Icons.ExternalLink className="w-spacing-sm h-spacing-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSeoTab;
