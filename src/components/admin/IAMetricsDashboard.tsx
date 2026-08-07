import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Download, 
  AlertTriangle, 
  TrendingUp, 
  Smartphone, 
  Monitor,
  Calendar,
  User,
  Zap
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// Mock data para simular os custos por módulo e dispositivo
const moduleCosts = [
  { name: 'Leitor V2', desktop: 12.50, mobile: 18.20, total: 30.70 },
  { name: 'Logos IA', desktop: 45.30, mobile: 32.10, total: 77.40 },
  { name: 'Busca Nexus', desktop: 8.40, mobile: 12.60, total: 21.00 },
  { name: 'Certificação', desktop: 15.00, mobile: 5.00, total: 20.00 },
];

const dailyUsage = [
  { day: '01/08', tokens: 120000, cost: 0.06 },
  { day: '02/08', tokens: 150000, cost: 0.075 },
  { day: '03/08', tokens: 90000, cost: 0.045 },
  { day: '04/08', tokens: 200000, cost: 0.10 },
  { day: '05/08', tokens: 180000, cost: 0.09 },
  { day: '06/08', tokens: 250000, cost: 0.125 },
  { day: '07/08', tokens: 210000, cost: 0.105 },
];

export const IAMetricsDashboard = () => {
  const [budget, setBudget] = useState(150);
  const currentTotal = 149.10;
  const budgetProgress = (currentTotal / budget) * 100;
  
  const exportToCSV = () => {
    const headers = "Modulo,Desktop(USD),Mobile(USD),Total(USD)\n";
    const rows = moduleCosts.map(m => `${m.name},${m.desktop},${m.mobile},${m.total}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cathedra-ia-costs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Orçamento e Alertas */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Orçamento Mensal IA
          </CardTitle>
          {budgetProgress > 90 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="mr-1 h-3 w-3" /> Alerta de Limite
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gasto Atual (Agosto)</p>
              <p className="font-serif text-3xl tabular-nums">${currentTotal.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Meta/Limite</p>
              <p className="font-serif text-xl tabular-nums text-muted-foreground">${budget}</p>
            </div>
          </div>
          <Progress value={budgetProgress} className={`h-2 ${budgetProgress > 90 ? 'bg-red-100' : ''}`} />
          <p className="mt-2 text-[10px] text-muted-foreground italic">
            Configurado para alertar via e-mail/push ao atingir 80% e 95% do orçamento.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribuição por Módulo */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Custos por Módulo
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={exportToCSV} className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleCosts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                  />
                  <Bar dataKey="desktop" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="Desktop" />
                  <Bar dataKey="mobile" stackId="a" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} name="Mobile" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-[10px] uppercase tracking-wider">
              <div className="flex items-center gap-1"><Monitor className="h-3 w-3 text-primary" /> Desktop</div>
              <div className="flex items-center gap-1"><Smartphone className="h-3 w-3 text-secondary" /> Mobile</div>
            </div>
          </CardContent>
        </Card>

        {/* Uso Diário e Tendência */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Uso Diário (Tokens)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyUsage}>
                  <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="tokens" fill="hsl(var(--primary)/0.2)" radius={[4, 4, 0, 0]}>
                    {dailyUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === dailyUsage.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.4)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medidor de Usuário Típico */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" /> Perfil de Consumo por Usuário/Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Média Prompts</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">12.4</span>
                <span className="text-[10px] text-muted-foreground">req/dia</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tokens/Usuário</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">8.2k</span>
                <span className="text-[10px] text-muted-foreground">avg</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tempo Resposta</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">1.8s</span>
                <span className="text-[10px] text-muted-foreground">latência</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Custo Unitário</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-emerald-600">$0.004</span>
                <span className="text-[10px] text-muted-foreground">/dia</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
