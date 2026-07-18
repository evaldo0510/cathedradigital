import React, { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Icons } from '@/constants';

type ConnectionType = 'catechism' | 'bible' | 'document' | 'theology' | 'cross_ref';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookAbbr: string;
  bookName: string;
  chapter: number;
}

const CONTRIBUTION_SCHEMA = z.object({
  verse: z.string().max(6).optional(),
  connection_type: z.enum(['catechism', 'bible', 'document', 'theology', 'cross_ref']),
  reference_id: z.string().trim().max(120).optional(),
  reference_title: z.string().trim().min(3, 'Título muito curto').max(200, 'Máximo 200 caracteres'),
  summary: z.string().trim().min(10, 'Resumo muito curto (mín. 10 caracteres)').max(1000, 'Máximo 1000 caracteres'),
  contributor_notes: z.string().trim().max(1000).optional(),
});

const TYPE_LABELS: Record<ConnectionType, string> = {
  catechism: 'Catecismo (CIC)',
  bible: 'Escritura (Bíblia)',
  document: 'Magistério (Documento)',
  theology: 'Teologia / Nexus',
  cross_ref: 'Referência cruzada',
};

export const NexusContributionDialog: React.FC<Props> = ({ open, onOpenChange, bookAbbr, bookName, chapter }) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<ConnectionType>('catechism');
  const [verse, setVerse] = useState('');
  const [refId, setRefId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setType('catechism'); setVerse(''); setRefId(''); setTitle(''); setSummary(''); setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Faça login para contribuir com o Nexus.');
      return;
    }
    const parsed = CONTRIBUTION_SCHEMA.safeParse({
      verse: verse.trim() || undefined,
      connection_type: type,
      reference_id: refId.trim() || undefined,
      reference_title: title,
      summary,
      contributor_notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first || 'Verifique os campos.');
      return;
    }
    const verseNum = parsed.data.verse ? parseInt(parsed.data.verse, 10) : null;
    if (parsed.data.verse && (Number.isNaN(verseNum!) || verseNum! <= 0)) {
      toast.error('Versículo deve ser um número positivo.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('nexus_contributions').insert({
      user_id: user.id,
      book_abbr: bookAbbr,
      chapter,
      verse: verseNum,
      connection_type: parsed.data.connection_type,
      reference_id: parsed.data.reference_id ?? null,
      reference_title: parsed.data.reference_title,
      summary: parsed.data.summary,
      contributor_notes: parsed.data.contributor_notes ?? null,
    });
    setSubmitting(false);

    if (error) {
      console.error('[nexus_contributions] insert failed', error);
      toast.error('Não foi possível enviar sua contribuição. Tente novamente.');
      return;
    }

    toast.success('Contribuição enviada! Será revisada pelos editores.');
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="nexus-contribution-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Contribuir com o Nexus</DialogTitle>
          <DialogDescription>
            {bookName} {chapter} — sugira uma conexão com o Catecismo, Magistério ou Escritura. Sua sugestão passará por revisão editorial antes de ser publicada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nexus-contrib-verse">Versículo (opcional)</Label>
              <Input
                id="nexus-contrib-verse"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ex.: 3"
                value={verse}
                onChange={(e) => setVerse(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nexus-contrib-type">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as ConnectionType)}>
                <SelectTrigger id="nexus-contrib-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as ConnectionType[]).map((k) => (
                    <SelectItem key={k} value={k}>{TYPE_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="nexus-contrib-refid">
              ID da referência (opcional) <span className="text-xs text-muted-foreground">— ex.: 1234 (CIC), Jo-6-35 (Escritura)</span>
            </Label>
            <Input id="nexus-contrib-refid" value={refId} onChange={(e) => setRefId(e.target.value)} maxLength={120} />
          </div>

          <div>
            <Label htmlFor="nexus-contrib-title">Título da conexão *</Label>
            <Input
              id="nexus-contrib-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Ex.: A Nova Jerusalém e a Igreja celeste"
            />
          </div>

          <div>
            <Label htmlFor="nexus-contrib-summary">Resumo teológico *</Label>
            <Textarea
              id="nexus-contrib-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              maxLength={1000}
              rows={4}
              placeholder="Explique brevemente por que esta passagem se conecta a essa referência."
            />
            <p className="text-xs text-muted-foreground mt-1">{summary.length}/1000</p>
          </div>

          <div>
            <Label htmlFor="nexus-contrib-notes">Notas para o revisor (opcional)</Label>
            <Textarea
              id="nexus-contrib-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Fontes, contexto, observações."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} data-testid="nexus-contribution-submit">
              {submitting ? (
                <><Icons.Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando…</>
              ) : (
                <><Icons.Send className="w-4 h-4 mr-2" /> Enviar contribuição</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NexusContributionDialog;
