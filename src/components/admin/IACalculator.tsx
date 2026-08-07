import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Cpu, Hash, DollarSign } from "lucide-react";

export const IACalculator = () => {
  const [users, setUsers] = useState<number>(100);
  const [promptsPerUser, setPromptsPerUser] = useState<number>(10);
  const [tokensPerPrompt, setTokensPerPrompt] = useState<number>(500);
  const [costPerMillionTokens, setCostPerMillionTokens] = useState<number>(0.5); // USD

  const result = useMemo(() => {
    const dailyPrompts = users * promptsPerUser;
    const dailyTokens = dailyPrompts * tokensPerPrompt;
    const monthlyTokens = dailyTokens * 30;
    const monthlyCost = (monthlyTokens / 1_000_000) * costPerMillionTokens;
    
    return {
      dailyTokens,
      monthlyTokens,
      monthlyCost
    };
  }, [users, promptsPerUser, tokensPerPrompt, costPerMillionTokens]);

  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-amber-600" />
          Calculadora de Custos IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="users" className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" /> Usuários Ativos
            </Label>
            <Input 
              id="users" 
              type="number" 
              value={users} 
              onChange={(e) => setUsers(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompts" className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3 w-3" /> Prompts/Dia por Usuário
            </Label>
            <Input 
              id="prompts" 
              type="number" 
              value={promptsPerUser} 
              onChange={(e) => setPromptsPerUser(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tokens" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tokens Médios por Prompt
            </Label>
            <Input 
              id="tokens" 
              type="number" 
              value={tokensPerPrompt} 
              onChange={(e) => setTokensPerPrompt(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost" className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Custo por 1M Tokens (USD)
            </Label>
            <Input 
              id="cost" 
              type="number" 
              step="0.01"
              value={costPerMillionTokens} 
              onChange={(e) => setCostPerMillionTokens(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-amber-500/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tokens / Dia</p>
            <p className="font-mono text-lg font-bold">{(result.dailyTokens / 1000).toFixed(1)}k</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tokens / Mês</p>
            <p className="font-mono text-lg font-bold">{(result.monthlyTokens / 1_000_000).toFixed(2)}M</p>
          </div>
          <div className="bg-amber-500/10 p-2 rounded border border-amber-500/20">
            <p className="text-[10px] uppercase tracking-wider text-amber-800 font-bold">Custo Estimado / Mês</p>
            <p className="font-serif text-2xl font-bold text-amber-900">
              ${result.monthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-amber-700/70 mt-1 italic">
              Aprox. ${(result.monthlyCost / (users || 1)).toFixed(3)} por usuário
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
