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
import { 
  Globe, Search, LineChart, Save, Plus, Trash2, 
  ExternalLink, CheckCircle2, AlertCircle, Sparkles,
  Smartphone, Monitor, Share2, Info, MapPin, XCircle, Copy, FileCode, Eye, Check
} from 'lucide-react';
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-primary">
                  <Globe className="w-5 h-5" />
                  <div>
                    <CardTitle className="text-lg font-serif">Configurações Técnicas de SEO</CardTitle>
                    <CardDescription>Gerencie meta tags, títulos e indexação global.</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full gap-2 border-primary/20 hover:bg-primary/5"
                  onClick={() => navigate(AppRoute.SEO_VERIFY)}
                >
                  <Eye className="w-4 h-4" />
                  Auditoria de Metadados
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70">Título Base do Site (Google Title)</Label>
                  <Input 
                    value={formData.site_title || ''} 
                    onChange={e => setFormData({...formData, site_title: e.target.value})}
                    placeholder="Ex: Cathedra Digital — Bíblia e Tradição"
                  />
                  <p className="text-premium-tiny text-muted-foreground italic">Recomendado: 50-60 caracteres.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70">Meta Description Global</Label>
                  <Textarea 
                    value={formData.site_description || ''} 
                    onChange={e => setFormData({...formData, site_description: e.target.value})}
                    placeholder="Descrição que aparecerá no Google..."
                    rows={3}
                  />
                  <p className="text-premium-tiny text-muted-foreground italic">Recomendado: 150-160 caracteres.</p>
                </div>

                <div className="space-y-4 pt-6 border-t border-border/50">
                  <h4 className="text-sm font-serif font-bold text-primary flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> SEO Local & NAP
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70">Nome do Negócio</Label>
                      <Input 
                        value={formData.business_name || ''} 
                        onChange={e => setFormData({...formData, business_name: e.target.value})}
                        placeholder="Ex: Cathedra Digital HQ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70">Email de Contato</Label>
                      <Input 
                        value={formData.business_email || ''} 
                        onChange={e => setFormData({...formData, business_email: e.target.value})}
                        placeholder="contato@cathedra.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70">Endereço Físico</Label>
                      <Input 
                        value={formData.business_address || ''} 
                        onChange={e => setFormData({...formData, business_address: e.target.value})}
                        placeholder="Rua Exemplo, 123 - São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70">Horário de Funcionamento</Label>
                      <Input 
                        value={formData.opening_hours || ''} 
                        onChange={e => setFormData({...formData, opening_hours: e.target.value})}
                        placeholder="Seg-Sex 08:00-18:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70">WhatsApp / Telefone</Label>
                      <Input 
                        value={formData.business_whatsapp || ''} 
                        onChange={e => setFormData({...formData, business_whatsapp: e.target.value})}
                        placeholder="+55 11 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70">Google Maps URL</Label>
                      <Input 
                        value={formData.google_maps_url || ''} 
                        onChange={e => setFormData({...formData, google_maps_url: e.target.value})}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border/50">
                  <div className="space-y-2">
                    <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70 flex items-center gap-1">
                      <Search className="w-3 h-3" /> GSC Verification Code
                    </Label>
                    <Input 
                      value={formData.gsc_verification_code || ''} 
                      onChange={e => setFormData({...formData, gsc_verification_code: e.target.value})}
                      placeholder="Código da meta tag google-site-verification"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-premium-tiny font-black uppercase tracking-widest opacity-70 flex items-center gap-1">
                      <LineChart className="w-3 h-3" /> GA4 Measurement ID
                    </Label>
                    <Input 
                      value={formData.ga4_measurement_id || ''} 
                      onChange={e => setFormData({...formData, ga4_measurement_id: e.target.value})}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveSEO} 
                  disabled={loading}
                  className="rounded-full bg-primary px-8"
                >
                  <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Simulação de Google Snippet</CardTitle>
              <CardDescription>Como seu site aparece nos resultados de busca.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-background border border-border/50 rounded-2xl p-6 shadow-inner space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 bg-muted rounded-2xl flex items-center justify-center overflow-hidden">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="text-premium-small text-[#202124]">
                    cathedradigital.lovable.app
                  </div>
                </div>
                <h3 className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer leading-tight">
                  {formData.site_title || 'Cathedra Digital — Bíblia e Tradição'}
                </h3>
                <p className="text-[14px] text-[#4d5156] leading-relaxed line-clamp-2">
                  {formData.site_description || 'Aprofunde sua fé católica com Bíblia Sagrada, Catecismo da Igreja e IA teológica.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm h-fit">
            <CardHeader className="bg-muted/10 border-b border-border/50">
              <CardTitle className="text-md font-serif flex items-center gap-2">
                <LineChart className="w-4 h-4 text-primary" /> GA4 Debug Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span>Measurement ID:</span>
                <Badge variant="outline" className="font-mono">{formData.ga4_measurement_id || 'Não configurado'}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Script Status:</span>
                {(typeof window !== 'undefined' && (window as any).gtag) ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                    <XCircle className="w-3 h-3" /> Inativo
                  </Badge>
                )}
              </div>
              <div className="pt-2 space-y-2 border-t border-border/50">
                <p className="text-premium-tiny font-black uppercase tracking-widest opacity-60">Rastreamento Ativo:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Page Views', 'Clicks', 'Submits', 'Session'].map(ev => (
                    <div key={ev} className="flex items-center gap-1.5 text-premium-tiny font-medium">
                      <div className={`w-1.5 h-1.5 rounded-full ${(window as any).gtag ? 'bg-emerald-500' : 'bg-muted'}`} />
                      {ev}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm h-fit">
            <CardHeader className="bg-amber-500/5 border-b border-border/50">
              <CardTitle className="text-md font-serif flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" /> Validação NAP & Local SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-premium-tiny font-black uppercase tracking-widest opacity-60">
                  <span>NAP Status</span>
                  {formData.business_name && formData.business_address && (formData.business_phone || formData.business_whatsapp) && formData.opening_hours ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Válido</span>
                  ) : (
                    <span className="text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Incompleto</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant={formData.business_name ? "secondary" : "outline"} className="text-premium-tiny h-5 justify-start">Name: {formData.business_name ? 'OK' : 'Missing'}</Badge>
                  <Badge variant={formData.business_address ? "secondary" : "outline"} className="text-premium-tiny h-5 justify-start">Address: {formData.business_address ? 'OK' : 'Missing'}</Badge>
                  <Badge variant={formData.business_phone || formData.business_whatsapp ? "secondary" : "outline"} className="text-premium-tiny h-5 justify-start">Phone: {formData.business_phone || formData.business_whatsapp ? 'OK' : 'Missing'}</Badge>
                  <Badge variant={formData.opening_hours ? "secondary" : "outline"} className="text-premium-tiny h-5 justify-start">Hours: {formData.opening_hours ? 'OK' : 'Missing'}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-premium-tiny font-black uppercase tracking-widest opacity-60">Schema Preview:</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setJsonMode(jsonMode === 'pretty' ? 'minified' : 'pretty')}
                      className="text-premium-tiny font-bold uppercase underline text-primary"
                    >
                      {jsonMode === 'pretty' ? 'Minificar' : 'Pretty Print'}
                    </Button>
                    <Button 
                      onClick={handleCopyJSONLD}
                      className="flex items-center gap-1 text-premium-tiny font-bold uppercase text-primary hover:bg-primary/5 p-1 rounded"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copiar
                    </Button>
                  </div>
                </div>
                <div className="bg-black/90 text-amber-400 p-3 rounded-2xl text-premium-tiny font-mono overflow-x-auto max-h-[150px] no-scrollbar shadow-inner border border-amber-500/20">
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

              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-premium-tiny font-black uppercase tracking-widest opacity-60">DOM Verification:</p>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={verifyDOM}
                    className="h-6 text-premium-tiny uppercase font-black"
                   >
                     <Eye className="w-3 h-3 mr-1" /> Verificar no Site
                   </Button>
                </div>
                <div className={`p-2 rounded-full border flex items-center justify-between ${
                  domVerified === 'ok' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 
                  domVerified === 'fail' ? 'bg-destructive/5 border-destructive/20 text-destructive' : 
                  'bg-muted/30 border-border/50 text-muted-foreground'
                }`}>
                  <span className="text-premium-tiny font-bold">
                    {domVerified === 'pending' ? 'Aguardando verificação...' : 
                     domVerified === 'ok' ? 'JSON-LD Ativo no DOM' : 'JSON-LD Ausente ou Inválido'}
                  </span>
                  {domVerified === 'ok' && <Check className="w-3 h-3" />}
                  {domVerified === 'fail' && <AlertCircle className="w-3 h-3" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm h-fit">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="text-md font-serif flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> IA SEO Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-3 bg-muted/50 rounded-2xl border border-border/50 text-premium-small leading-relaxed">
                <p className="font-bold text-primary mb-1">Dica Local:</p>
                "Adicionar o bairro ao endereço ajuda no posicionamento do Google Maps."
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm h-fit bg-muted/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-premium-tiny font-black uppercase tracking-widest text-primary">
                <Info className="w-3 h-3" /> Links Úteis
              </div>
              <div className="space-y-2">
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="flex items-center justify-between text-xs hover:text-primary hover:underline group">
                  Search Console <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a href="/sitemap.xml" target="_blank" className="flex items-center justify-between text-xs hover:text-primary hover:underline group">
                  Sitemap XML <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
