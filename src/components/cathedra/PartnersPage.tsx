import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/constants';
import { EditorialHero } from '@/components/editorial';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  LOGO_ACCEPT,
  processLogo,
  validateLogoFile,
  objectUrlFromBlob,
} from '@/lib/partners/logoImage';

type PartnerType = 'institution' | 'company' | 'individual';

interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  partner_type: PartnerType | null;
}

type ApplicationForm = {
  name: string;
  contact_email: string;
  description: string;
  website_url: string;
  partner_type: PartnerType;
};

const EMPTY_FORM: ApplicationForm = {
  name: '',
  contact_email: '',
  description: '',
  website_url: '',
  partner_type: 'institution',
};

const TYPE_LABEL: Record<PartnerType, string> = {
  institution: 'Instituição',
  company: 'Empresa',
  individual: 'Indivíduo',
};

/* ------------------------------------------------------------------ */
/* Diálogo único de candidatura                                        */
/* ------------------------------------------------------------------ */

interface ApplicationDialogProps {
  trigger: React.ReactNode;
  idScope: string;
}

const ApplicationDialog: React.FC<ApplicationDialogProps> = ({ trigger, idScope }) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);

  const [logoFile, setLogoFile] = useState<Blob | null>(null);
  const [logoExt, setLogoExt] = useState<string>('webp');
  const [logoContentType, setLogoContentType] = useState<string>('image/webp');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setLogoFile(null);
    setLogoPreview(null);
    setLogoExt('webp');
    setLogoContentType('image/webp');
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-selecionar mesmo arquivo
    if (!file) return;

    const err = validateLogoFile(file);
    if (err) { toast.error(err.message); return; }

    setLogoBusy(true);
    try {
      const { blob, extension, contentType } = await processLogo(file);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoFile(blob);
      setLogoExt(extension);
      setLogoContentType(contentType);
      setLogoPreview(objectUrlFromBlob(blob));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao processar imagem.');
    } finally {
      setLogoBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact_email.trim()) {
      toast.error('Nome e e-mail são obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);

      // 1) Upload da logo (opcional). Guardamos o *path* no bucket privado
      //    e a aprovação transforma em signed URL de longa duração.
      let logoPath: string | null = null;
      if (logoFile) {
        const path = `submissions/${crypto.randomUUID()}.${logoExt}`;
        const { error: upErr } = await supabase.storage
          .from('partner-logos')
          .upload(path, logoFile, { contentType: logoContentType, upsert: false });
        if (upErr) throw upErr;
        logoPath = path;
      }

      // 2) Insere candidatura como pending.
      const { data: inserted, error } = await supabase
        .from('partners')
        .insert([{
          name: form.name.trim(),
          contact_email: form.contact_email.trim(),
          description: form.description.trim() || null,
          website_url: form.website_url.trim() || null,
          logo_url: logoPath,
          partner_type: form.partner_type,
          status: 'pending',
        } as never])
        .select('id')
        .single();
      if (error) throw error;

      // 3) Notifica (best-effort — não bloqueia UI).
      if (inserted?.id) {
        supabase.functions
          .invoke('partner-notify', { body: { partner_id: inserted.id, action: 'received' } })
          .catch(() => {});
      }

      toast.success('Candidatura recebida. Retornaremos em breve.');
      resetForm();
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Não foi possível enviar: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[560px] overflow-y-auto max-h-[90dvh]">
        <DialogHeader>
          <DialogTitle className="text-premium-2xl">Candidatura de Parceria</DialogTitle>
          <DialogDescription>
            Compartilhe sua missão. Analisamos cada proposta com cuidado editorial antes de acolher publicamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-spacing-md pt-spacing-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-md">
            <div className="space-y-spacing-xs">
              <Label htmlFor={`${idScope}-type`}>Tipo *</Label>
              <Select
                value={form.partner_type}
                onValueChange={(v) => setForm(prev => ({ ...prev, partner_type: v as PartnerType }))}
              >
                <SelectTrigger id={`${idScope}-type`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="institution">Instituição</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="individual">Indivíduo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-spacing-xs">
              <Label htmlFor={`${idScope}-email`}>E-mail de Contato *</Label>
              <Input id={`${idScope}-email`} name="contact_email" type="email" value={form.contact_email} onChange={onChange} placeholder="contato@instituicao.org" required />
            </div>
          </div>

          <div className="space-y-spacing-xs">
            <Label htmlFor={`${idScope}-name`}>Nome *</Label>
            <Input id={`${idScope}-name`} name="name" value={form.name} onChange={onChange} placeholder="Ex.: Editora São José" required />
          </div>

          <div className="space-y-spacing-xs">
            <Label htmlFor={`${idScope}-desc`}>Missão e Áreas de Atuação</Label>
            <Textarea
              id={`${idScope}-desc`}
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Fale brevemente sobre a obra que você representa e como imagina caminhar conosco."
              className="min-h-[110px] resize-none"
            />
          </div>

          <div className="space-y-spacing-xs">
            <Label htmlFor={`${idScope}-site`}>Site Externo</Label>
            <Input id={`${idScope}-site`} name="website_url" value={form.website_url} onChange={onChange} placeholder="https://..." />
          </div>

          <div className="space-y-spacing-xs">
            <Label htmlFor={`${idScope}-logo`}>Logo (PNG, JPG, WebP ou SVG · até 2 MB)</Label>
            <div className="flex items-center gap-spacing-md">
              <div className="w-spacing-4xl h-spacing-4xl rounded-premium bg-muted/40 flex items-center justify-center overflow-hidden border border-border">
                {logoPreview ? (
                  <img src={logoPreview} alt="Prévia da logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Icons.Image className="w-spacing-lg h-spacing-lg text-muted-foreground/60" />
                )}
              </div>
              <div className="flex-1 space-y-spacing-xs">
                <Input
                  id={`${idScope}-logo`}
                  type="file"
                  accept={LOGO_ACCEPT}
                  onChange={onLogoPick}
                  disabled={logoBusy}
                />
                <p className="text-premium-xs text-muted-foreground">
                  Redimensionamos automaticamente para 512×512 preservando a transparência.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-spacing-md rounded-premium flex gap-spacing-sm text-premium-xs text-muted-foreground leading-relaxed">
            <Icons.Info className="w-spacing-md h-spacing-md shrink-0 text-primary" />
            <p>
              Cada candidatura passa por análise editorial. Apenas parceiros aprovados são exibidos publicamente no Cathedra.
            </p>
          </div>

          <Button type="submit" className="w-full h-spacing-2xl text-premium-base font-semibold" disabled={submitting || logoBusy}>
            {submitting ? (
              <>
                <Icons.Loader className="w-spacing-md h-spacing-md mr-spacing-xs animate-spin" />
                Enviando…
              </>
            ) : (
              'Enviar candidatura'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/* Cartão de parceiro                                                  */
/* ------------------------------------------------------------------ */

const PartnerCard: React.FC<{ partner: Partner; index: number }> = ({ partner, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.06, 0.3) }}
  >
    <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card hover:shadow-premium-hover transition-all duration-300 group">
      <CardHeader className="relative h-spacing-4xl flex items-center justify-center bg-muted/20">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt={`Logo — ${partner.name}`}
            loading="lazy"
            className="max-h-spacing-4xl max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-primary/10 flex items-center justify-center text-primary">
            <Icons.Trophy className="w-spacing-xl h-spacing-xl" />
          </div>
        )}
        {partner.partner_type && (
          <Badge variant="secondary" className="absolute top-spacing-xs right-spacing-xs">
            {TYPE_LABEL[partner.partner_type]}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-spacing-lg space-y-spacing-sm flex-1">
        <CardTitle className="text-premium-xl group-hover:text-primary transition-colors">
          {partner.name}
        </CardTitle>
        <CardDescription className="text-premium-sm line-clamp-spacing-sm leading-relaxed">
          {partner.description ?? 'Parceiro do Cathedra.'}
        </CardDescription>
      </CardContent>
      {partner.website_url && (
        <CardFooter className="p-spacing-lg pt-spacing-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-spacing-xs text-primary hover:text-primary hover:bg-primary/10"
            asChild
          >
            <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
              Visitar site <Icons.ExternalLink className="w-spacing-md h-spacing-md" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Estado vazio                                                        */
/* ------------------------------------------------------------------ */

const EmptyState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-spacing-3xl px-spacing-lg text-center space-y-spacing-lg bg-muted/20 rounded-premium border-2 border-dashed border-border/50"
  >
    <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-primary/5 flex items-center justify-center">
      <Icons.Community className="w-spacing-xl h-spacing-xl text-muted-foreground/60" />
    </div>
    <div className="space-y-spacing-xs max-w-xl">
      <h2 className="text-premium-2xl font-semibold text-foreground/90">
        As primeiras alianças estão sendo tecidas
      </h2>
      <p className="text-muted-foreground leading-relaxed">
        Estamos formando um círculo de instituições, editoras e comunidades comprometidas com a difusão da Fé e da Cultura Católica. Sua obra pode caminhar conosco.
      </p>
    </div>

    <ApplicationDialog
      idScope="empty"
      trigger={
        <Button size="lg" className="rounded-premium-full px-spacing-xl gap-spacing-xs shadow-premium shadow-primary/20">
          <Icons.Plus className="w-spacing-md h-spacing-md" /> Tornar-se um Parceiro
        </Button>
      }
    />
  </motion.div>
);

const PartnersGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
    {[0, 1, 2].map(i => (
      <div key={i} className="h-spacing-4xl rounded-premium bg-muted/40 animate-pulse border border-border" />
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 12;

const PartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | PartnerType>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // debounce simples da busca
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // reset da paginação ao mudar filtros
  useEffect(() => { setPage(0); }, [typeFilter, search]);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, description, logo_url, website_url, partner_type')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners((data as unknown as Partner[]) ?? []);
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const filtered = useMemo(() => {
    return partners.filter(p => {
      if (typeFilter !== 'all' && p.partner_type !== typeFilter) return false;
      if (search) {
        const hay = `${p.name} ${p.description ?? ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [partners, typeFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const pageItems = useMemo(
    () => filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE),
    [filtered, pageSafe],
  );

  const hasPartners = !loading && partners.length > 0;

  return (
    <div className="w-full space-y-spacing-2xl py-spacing-md">
      <EditorialHero
        align="center"
        size="md"
        variant="legacy"
        kicker={
          <span className="inline-flex items-center gap-spacing-xs">
            <Icons.Handshake className="w-spacing-md h-spacing-md" />
            Unidos pela Missão
          </span>
        }
        title="Parceiros & Patrocinadores"
        subtitle="Instituições, editoras e comunidades que caminham conosco na difusão da Fé e da Cultura Católica através do Cathedra."
      />

      {hasPartners && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-spacing-md">
          <div className="relative w-full md:max-w-sm mx-auto md:mx-0">
            <Icons.Search className="absolute left-spacing-sm top-1/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar parceiro por nome ou descrição"
              aria-label="Buscar parceiros"
              className="pl-spacing-xl h-spacing-xl"
            />
          </div>
          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="institution">Instituições</TabsTrigger>
              <TabsTrigger value="company">Empresas</TabsTrigger>
              <TabsTrigger value="individual">Indivíduos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <section aria-labelledby="partners-list" className="min-h-[400px] space-y-spacing-xl">
        <h2 id="partners-list" className="sr-only">Lista de parceiros</h2>
        {loading ? (
          <PartnersGridSkeleton />
        ) : hasPartners ? (
          filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
                {pageItems.map((partner, i) => (
                  <PartnerCard key={partner.id} partner={partner} index={i} />
                ))}
              </div>
              {pageCount > 1 && (
                <nav className="flex items-center justify-center gap-spacing-md" aria-label="Paginação">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageSafe === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-premium-sm text-muted-foreground" aria-live="polite">
                    Página {pageSafe + 1} de {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageSafe >= pageCount - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Próxima
                  </Button>
                </nav>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-spacing-3xl">
              {search
                ? `Nenhum parceiro corresponde a "${search}".`
                : 'Nenhum parceiro nesta categoria ainda.'}
            </p>
          )
        ) : (
          <EmptyState />
        )}
      </section>

      {hasPartners && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-primary/5 rounded-premium p-spacing-xl md:p-spacing-2xl text-center space-y-spacing-lg border border-primary/10"
        >
          <div className="w-full max-w-2xl mx-auto space-y-spacing-md">
            <h2 className="text-premium-2xl md:text-premium-3xl font-bold">
              Quer sustentar esta missão?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Torne-se patrocinador e ajude a manter o Cathedra gratuito, sério e acessível a milhares de fiéis em todo o mundo.
            </p>
            <div className="pt-spacing-md flex flex-col sm:flex-row gap-spacing-md justify-center">
              <ApplicationDialog
                idScope="cta"
                trigger={
                  <Button size="lg" className="rounded-premium-full px-spacing-xl">
                    Falar com a Equipe
                  </Button>
                }
              />
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default PartnersPage;
