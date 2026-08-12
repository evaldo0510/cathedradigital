import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CheckCircle2, XCircle, FileText, Download } from 'lucide-react';

interface AuditItem {
  id: string;
  module: string;
  p: 'P0' | 'P1' | 'P2';
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  evidence?: string;
}

const initialAuditItems: AuditItem[] = [
  { id: 'catechism', module: 'Catecismo', p: 'P0', status: 'PASS' },
  { id: 'bible', module: 'Bíblia', p: 'P0', status: 'FAIL', evidence: 'Erro 409 em orações, falha na navegação de capítulos' },
  { id: 'saints', module: 'Santos', p: 'P0', status: 'PASS' },
  { id: 'nexus', module: 'Nexus', p: 'P1', status: 'PASS' },
  { id: 'patristic', module: 'Patrística', p: 'P1', status: 'BLOCKED', evidence: 'Indisponibilidade backend (Supabase)' },
];

export default function Audit77Dashboard() {
  const [items, setItems] = useState<AuditItem[]>(initialAuditItems);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Helmet>
        <title>Cathedra · AUDIT 7.7 Dashboard</title>
      </Helmet>

      <h1 className="font-serif text-2xl mb-6">AUDIT 7.7 — Certificação Funcional Real</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Progresso</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-serif">60%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Falhas Ativas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-serif text-red-600">1</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Bloqueios Backend</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-serif text-amber-600">1</p></CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.p}</Badge>
                <h3 className="font-semibold">{item.module}</h3>
              </div>
              {item.evidence && <p className="text-xs text-muted-foreground mt-1">{item.evidence}</p>}
            </div>
            <div className="flex items-center gap-2">
              {item.status === 'PASS' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {item.status === 'FAIL' && <XCircle className="h-5 w-5 text-red-500" />}
              {item.status === 'BLOCKED' && <ShieldAlert className="h-5 w-5 text-amber-500" />}
              <Badge variant={item.status === 'PASS' ? 'secondary' : 'destructive'}>{item.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
