import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
}

const PartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    logo_url: '',
    contact_email: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_partners' as any)
        .select('id, name, description, logo_url, website_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners((data as unknown as Partner[]) || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('O nome é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('partners')
        .insert([{
          name: formData.name,
          description: formData.description,
          website_url: formData.website_url,
          logo_url: formData.logo_url,
          contact_email: formData.contact_email,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('Solicitação enviada com sucesso! Analisaremos em breve.');
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        website_url: '',
        logo_url: '',
        contact_email: ''
      });
    } catch (error: any) {
      toast.error('Erro ao enviar solicitação: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-spacing-2xl py-spacing-md">
      {/* Header Section */}
      <section className="text-center space-y-spacing-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs rounded-full bg-primary/10 text-primary text-sm font-medium mb-spacing-xs"
        >
          <Icons.Handshake className="w-spacing-md h-spacing-md" />
          Unidos pela Missão
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
        >
          Parceiros & Patrocinadores
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-spacing-2xl mx-auto"
        >
          Instituições, empresas e indivíduos que apoiam a disseminação da Fé e da Cultura Católica através do Cathedra.
        </motion.p>
      </section>

      {/* Main Grid */}
      <section className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-spacing-4xl rounded-premium bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : partners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-premium-hover transition-all duration-300 border-border/50 bg-card  overflow-hidden group">
                  <CardHeader className="relative h-spacing-4xl flex items-center justify-center bg-muted/20">
                    {partner.logo_url ? (
                      <img 
                        src={partner.logo_url} 
                        alt={partner.name} 
                        className="max-h-spacing-4xl max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
                        <Icons.Trophy className="w-spacing-xl h-spacing-xl" />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-spacing-lg space-y-spacing-sm">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {partner.name}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-3 leading-relaxed">
                      {partner.description || "Sem descrição disponível."}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="p-spacing-lg pt-0 mt-auto">
                    {partner.website_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full gap-spacing-xs text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                        asChild
                      >
                        <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                          Visitar Site <Icons.ExternalLink className="w-spacing-md h-spacing-md" />
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-spacing-3xl px-spacing-lg text-center space-y-spacing-lg bg-muted/20 rounded-full border-2 border-dashed border-border/50"
          >
            <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-primary/5 flex items-center justify-center">
              <Icons.Community className="w-spacing-xl h-spacing-xl text-muted-foreground/50" />
            </div>
            <div className="space-y-spacing-xs">
              <h3 className="text-2xl font-semibold text-foreground/80">
                Em breve novos parceiros farão parte desta missão
              </h3>
              <p className="text-muted-foreground max-w-spacing-md mx-auto">
                Estamos construindo alianças sólidas para expandir o acesso à Verdade. Sua instituição também pode fazer parte.
              </p>
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full px-spacing-xl gap-spacing-xs shadow-premium shadow-primary/20">
                  <Icons.Plus className="w-spacing-md h-spacing-md" /> Tornar-se um Parceiro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90dvh]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Candidatura de Parceria</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para submeter sua proposta de parceria ou patrocínio.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-spacing-md pt-spacing-md">
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="name">Nome da Instituição/Empresa *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="Ex: Editora São José" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="contact_email">E-mail de Contato *</Label>
                    <Input 
                      id="contact_email" 
                      name="contact_email" 
                      type="email"
                      value={formData.contact_email} 
                      onChange={handleInputChange} 
                      placeholder="seu@email.com" 
                      required 
                    />
                  </div>

                  <div className="space-y-spacing-xs">
                    <Label htmlFor="description">Breve Descrição</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      placeholder="Conte-nos um pouco sobre sua missão..." 
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md">
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="website_url">Site Externo (URL)</Label>
                      <Input 
                        id="website_url" 
                        name="website_url" 
                        value={formData.website_url} 
                        onChange={handleInputChange} 
                        placeholder="https://..." 
                      />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="logo_url">URL da Logo</Label>
                      <Input 
                        id="logo_url" 
                        name="logo_url" 
                        value={formData.logo_url} 
                        onChange={handleInputChange} 
                        placeholder="https://..." 
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-spacing-md rounded-premium flex gap-spacing-sm text-xs text-muted-foreground leading-relaxed">
                    <Icons.Info className="w-spacing-md h-spacing-md shrink-0 text-primary" />
                    <p>Ao enviar, sua solicitação passará por uma análise administrativa. Apenas parceiros aprovados serão exibidos publicamente na plataforma.</p>
                  </div>

                  <Button type="submit" className="w-full h-spacing-2xl text-base font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Icons.Loader className="w-spacing-md h-spacing-md mr-spacing-xs animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Solicitação'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </section>

      {/* If partners exist, still show the CTA at the bottom */}
      {partners.length > 0 && (
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-primary/5 rounded-full p-spacing-xl md:p-spacing-2xl text-center space-y-spacing-lg border border-primary/10"
        >
          <div className="max-w-spacing-2xl mx-auto space-y-spacing-md">
            <h2 className="text-2xl md:text-3xl font-bold">Quer apoiar esta causa?</h2>
            <p className="text-muted-foreground">
              Junte-se a nós como um patrocinador e ajude a manter o Cathedra gratuito e acessível para milhares de fiéis em todo o mundo.
            </p>
            <div className="pt-spacing-md flex flex-col sm:flex-row gap-spacing-md justify-center">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full px-spacing-xl">Falar com a Equipe</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90dvh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Candidatura de Parceria</DialogTitle>
                    <DialogDescription>
                      Preencha os dados abaixo para submeter sua proposta de parceria ou patrocínio.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-spacing-md pt-spacing-md">
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="name-bottom">Nome da Instituição/Empresa *</Label>
                      <Input id="name-bottom" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Editora São José" required />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="email-bottom">E-mail de Contato *</Label>
                      <Input id="email-bottom" name="contact_email" type="email" value={formData.contact_email} onChange={handleInputChange} placeholder="seu@email.com" required />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="desc-bottom">Breve Descrição</Label>
                      <Textarea id="desc-bottom" name="description" value={formData.description} onChange={handleInputChange} placeholder="Conte-nos um pouco sobre sua missão..." className="min-h-[100px] resize-none" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md">
                      <div className="space-y-spacing-xs">
                        <Label htmlFor="site-bottom">Site Externo (URL)</Label>
                        <Input id="site-bottom" name="website_url" value={formData.website_url} onChange={handleInputChange} placeholder="https://..." />
                      </div>
                      <div className="space-y-spacing-xs">
                        <Label htmlFor="logo-bottom">URL da Logo</Label>
                        <Input id="logo-bottom" name="logo_url" value={formData.logo_url} onChange={handleInputChange} placeholder="https://..." />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-spacing-2xl text-base font-semibold" disabled={isSubmitting}>
                      {isSubmitting ? <><Icons.Loader className="w-spacing-md h-spacing-md mr-spacing-xs animate-spin" /> Enviando...</> : 'Enviar Solicitação'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="lg" className="rounded-full px-spacing-xl">Saiba Mais</Button>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default PartnersPage;