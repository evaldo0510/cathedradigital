import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, UserPlus, ShieldCheck } from 'lucide-react';

type GlossaryRole = 'editor' | 'reviewer' | 'admin';

interface Row {
  user_id: string;
  role: GlossaryRole;
  granted_at: string;
  email?: string | null;
}

const ROLE_LABEL: Record<GlossaryRole, string> = {
  editor: 'Editor',
  reviewer: 'Revisor',
  admin: 'Administrador',
};

/**
 * Painel de gestão de permissões editoriais do Glossário.
 * Visível apenas para administradores (protegido no cliente e pela RLS).
 */
export default function GlossaryPermissionsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<GlossaryRole>('editor');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('glossary_permissions')
      .select('user_id, role, granted_at')
      .order('granted_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar permissões: ' + error.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const grant = async () => {
    const target = email.trim().toLowerCase();
    if (!target) return toast.error('Informe o e-mail do usuário.');
    setSaving(true);
    // Resolve user_id pelo e-mail via RPC dedicada (definir se ainda não existir).
    const { data: uid, error: rpcErr } = await supabase.rpc('resolve_user_id_by_email', { _email: target });
    if (rpcErr || !uid) {
      setSaving(false);
      return toast.error(
        rpcErr?.message ??
        'Usuário não encontrado. Peça que ele faça login pelo menos uma vez antes de receber função.',
      );
    }
    const { error } = await supabase
      .from('glossary_permissions')
      .upsert({ user_id: uid as string, role }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return toast.error('Erro ao conceder função: ' + error.message);
    toast.success(`Função "${ROLE_LABEL[role]}" concedida a ${target}.`);
    setEmail('');
    void load();
  };

  const updateRole = async (user_id: string, next: GlossaryRole) => {
    const { error } = await supabase
      .from('glossary_permissions')
      .update({ role: next })
      .eq('user_id', user_id);
    if (error) return toast.error('Erro ao atualizar função: ' + error.message);
    toast.success('Função atualizada.');
    void load();
  };

  const revoke = async (user_id: string) => {
    if (!confirm('Revogar a função deste usuário no Glossário?')) return;
    const { error } = await supabase.from('glossary_permissions').delete().eq('user_id', user_id);
    if (error) return toast.error('Erro ao revogar: ' + error.message);
    toast.success('Função revogada.');
    void load();
  };

  const counts = useMemo(() => {
    const c: Record<GlossaryRole, number> = { editor: 0, reviewer: 0, admin: 0 };
    for (const r of rows) c[r.role] = (c[r.role] ?? 0) + 1;
    return c;
  }, [rows]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Permissões editoriais
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Editores criam e editam. Revisores publicam. Administradores excluem e gerenciam funções.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {counts.editor} editor(es) · {counts.reviewer} revisor(es) · {counts.admin} admin(s)
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 items-end">
          <div>
            <Label>E-mail do usuário</Label>
            <Input
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <Label>Função</Label>
            <Select value={role} onValueChange={(v) => setRole(v as GlossaryRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="reviewer">Revisor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={grant} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Conceder
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead className="w-40">Função</TableHead>
              <TableHead className="w-40">Concedida em</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando…
              </TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                Nenhuma função concedida ainda.
              </TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.user_id}>
                  <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                  <TableCell>
                    <Select value={r.role} onValueChange={(v) => updateRole(r.user_id, v as GlossaryRole)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="reviewer">Revisor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.granted_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => revoke(r.user_id)} aria-label="Revogar função"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
