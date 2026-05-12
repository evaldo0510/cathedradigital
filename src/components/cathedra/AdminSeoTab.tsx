import React, { useState, useEffect } from 'react';
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
  Smartphone, Monitor, Share2, Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminSeoTab: React.FC = () => {
  const { data: seoSettings, refetch: refetchSEO } = useSEO();
  const { data: keywords, refetch: refetchKeywords } = useKeywords();
  
  const [formData, setFormData] = useState<Partial<SEOSettings>>({});
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seoSettings) {
      setFormData(seoSettings);
    }
  }, [seoSettings]);

  const handleSaveSEO = async () => {
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-2 text-primary">
                <Globe className="w-5 h-5" />
                <div>
                  <CardTitle className="text-lg font-serif">Configurações Técnicas de SEO</CardTitle>
                  <CardDescription>Gerencie meta tags, títulos e indexação global.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Título Base do Site (Google Title)</Label>
                  <Input 
                    value={formData.site_title || ''} 
                    onChange={e => setFormData({...formData, site_title: e.target.value})}
                    placeholder="Ex: Cathedra Digital — Bíblia e Tradição"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Recomendado: 50-60 caracteres.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Meta Description Global</Label>
                  <Textarea 
                    value={formData.site_description || ''} 
                    onChange={e => setFormData({...formData, site_description: e.target.value})}
                    placeholder="Descrição que aparecerá no Google..."
                    rows={3}
                  />
                  <p className="text-[10px] text-muted-foreground italic">Recomendado: 150-160 caracteres.</p>
                </div>

                <div className="space-y-4 pt-6 border-t border-border/50">
                  <h4 className="text-sm font-serif font-bold text-primary flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> SEO Local & NAP
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome do Negócio</Label>
                      <Input 
                        value={formData.business_name || ''} 
                        onChange={e => setFormData({...formData, business_name: e.target.value})}
                        placeholder="Ex: Cathedra Digital HQ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Email de Contato</Label>
                      <Input 
                        value={formData.business_email || ''} 
                        onChange={e => setFormData({...formData, business_email: e.target.value})}
                        placeholder="contato@cathedra.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Endereço Físico</Label>
                      <Input 
                        value={formData.business_address || ''} 
                        onChange={e => setFormData({...formData, business_address: e.target.value})}
                        placeholder="Rua Exemplo, 123 - São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Horário de Funcionamento</Label>
                      <Input 
                        value={formData.opening_hours || ''} 
                        onChange={e => setFormData({...formData, opening_hours: e.target.value})}
                        placeholder="Seg-Sex 08:00-18:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">WhatsApp / Telefone</Label>
                      <Input 
                        value={formData.business_whatsapp || ''} 
                        onChange={e => setFormData({...formData, business_whatsapp: e.target.value})}
                        placeholder="+55 11 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Google Maps URL</Label>
                      <Input 
                        value={formData.google_maps_url || ''} 
                        onChange={e => setFormData({...formData, google_maps_url: e.target.value})}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-1">
                      <Search className="w-3 h-3" /> GSC Verification Code
                    </Label>
                    <Input 
                      value={formData.gsc_verification_code || ''} 
                      onChange={e => setFormData({...formData, gsc_verification_code: e.target.value})}
                      placeholder="Código da meta tag google-site-verification"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-1">
                      <LineChart className="w-3 h-3" /> GA4 Measurement ID
                    </Label>
                    <Input 
                      value={formData.ga4_measurement_id || ''} 
                      onChange={e => setFormData({...formData, ga4_measurement_id: e.target.value})}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-1">
                      <Share2 className="w-3 h-3" /> OG Image URL (Global)
                    </Label>
                    <Input 
                      value={formData.og_image_url || ''} 
                      onChange={e => setFormData({...formData, og_image_url: e.target.value})}
                      placeholder="https://sua-imagem.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-1">
                      Twitter Handle
                    </Label>
                    <Input 
                      value={formData.twitter_handle || ''} 
                      onChange={e => setFormData({...formData, twitter_handle: e.target.value})}
                      placeholder="@seuusuario"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveSEO} 
                  disabled={loading}
                  className="rounded-xl bg-primary px-8"
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
              <div className="bg-background border border-border/50 rounded-xl p-6 shadow-inner space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="text-[12px] text-[#202124]">
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
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="text-md font-serif flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Sugestões de IA SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg border border-border/50 text-[11px] leading-relaxed">
                <p className="font-bold text-primary mb-1">Otimização de Título:</p>
                "Adicione 'Online' ou 'App' ao título para capturar buscas mobile."
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border/50 text-[11px] leading-relaxed">
                <p className="font-bold text-primary mb-1">Faltando Schema:</p>
                "O Schema 'ReligiousOrganization' não está configurado completamente."
              </div>
              <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest h-8 rounded-lg">
                Gerar Novas Sugestões
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-md font-serif">Palavras-Chave Estratégicas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={newKeyword} 
                  onChange={e => setNewKeyword(e.target.value)}
                  placeholder="Nova keyword..."
                  className="h-9 text-xs"
                />
                <Button onClick={handleAddKeyword} size="icon" className="h-9 w-9 shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {keywords?.map(kw => (
                  <Badge key={kw.id} variant="secondary" className="gap-1 pr-1.5 py-1 text-[10px]">
                    {kw.keyword}
                    <button onClick={() => handleDeleteKeyword(kw.id)} className="hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm h-fit bg-muted/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                <Info className="w-3 h-3" /> Links Úteis
              </div>
              <div className="space-y-2">
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="flex items-center justify-between text-xs hover:text-primary hover:underline group">
                  Search Console <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a href="https://analytics.google.com" target="_blank" rel="noopener" className="flex items-center justify-between text-xs hover:text-primary hover:underline group">
                  Analytics GA4 <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
