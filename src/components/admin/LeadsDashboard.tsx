import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Calendar, Loader2 } from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  created_at: string;
}

export function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const { data, error } = await supabase
          .from('landing_leads' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLeads((data as any) || []);
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-spacing-4xl">
        <Loader2 className="h-spacing-lg w-spacing-lg animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-border/10 bg-card/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-premium-xl font-display">Leads Capturados</CardTitle>
        <Badge variant="outline" className="text-premium-xs uppercase tracking-widest">
          {leads.length} Contatos
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="rounded-premium-lg border border-border/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px] uppercase text-[10px] tracking-widest font-bold">Data</TableHead>
                <TableHead className="uppercase text-[10px] tracking-widest font-bold">E-mail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-spacing-2xl text-muted-foreground font-serif">
                    Nenhum lead capturado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="text-premium-xs font-mono text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lead.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-premium-sm font-serif">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-primary/40" />
                        {lead.email}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
