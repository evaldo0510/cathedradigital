/**
 * Sprint UX · Área do Usuário — seção Configurações.
 *
 * Agrupa os painéis existentes em abas: Conta / Aparência / Tipografia /
 * Áudio / Contemplativo / Notificações / Privacidade.
 *
 * Não recria nada — orquestra `A11ySettingsPanel` e `ReadingPreferencesPanel`
 * já presentes no projeto e delega o restante para a página de perfil
 * (que hospeda os controles legados de notificações / privacidade).
 */
import { Link } from "react-router-dom";
import { EditorialHero } from "@/components/editorial/harmony/EditorialHero";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserCircle, Palette, Type, Volume2, Sparkles, BellRing, ShieldCheck, ArrowRight } from "lucide-react";
import A11ySettingsPanel from "@/components/cathedra/A11ySettingsPanel";
import { ReadingPreferencesPanel } from "@/components/cathedra/ReadingPreferencesPanel";

function PlaceholderCard({ icon: Icon, title, description, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-serif text-base">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-serif text-base">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="secondary" size="sm" className="mt-4">
        <Link to={actionHref}>{actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
      </Button>
    </div>
  );
}

export default function ConfiguracoesSection() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <EditorialHero>
        <EditorialHero.Eyebrow>Configurações</EditorialHero.Eyebrow>
        <EditorialHero.Title>Preferências pessoais</EditorialHero.Title>
        <EditorialHero.Subtitle>
          Ajuste como você lê, ouve e recebe notificações da plataforma.
        </EditorialHero.Subtitle>
      </EditorialHero>

      <Tabs defaultValue="aparencia" className="mt-6">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="conta"         className="gap-1.5"><UserCircle className="h-3.5 w-3.5" /> Conta</TabsTrigger>
          <TabsTrigger value="aparencia"     className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Aparência</TabsTrigger>
          <TabsTrigger value="tipografia"    className="gap-1.5"><Type className="h-3.5 w-3.5" /> Tipografia</TabsTrigger>
          <TabsTrigger value="audio"         className="gap-1.5"><Volume2 className="h-3.5 w-3.5" /> Áudio</TabsTrigger>
          <TabsTrigger value="contemplativo" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Contemplativo</TabsTrigger>
          <TabsTrigger value="notificacoes"  className="gap-1.5"><BellRing className="h-3.5 w-3.5" /> Notificações</TabsTrigger>
          <TabsTrigger value="privacidade"   className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Privacidade</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-6">
          <PlaceholderCard
            icon={UserCircle}
            title="Dados da conta"
            description="Nome, e-mail, foto e vínculos pastorais são editados na tela de Perfil."
            actionHref="/conta/perfil" actionLabel="Editar perfil"
          />
        </TabsContent>

        <TabsContent value="aparencia" className="mt-6">
          <A11ySettingsPanel />
        </TabsContent>

        <TabsContent value="tipografia" className="mt-6">
          <ReadingPreferencesPanel />
        </TabsContent>

        <TabsContent value="audio" className="mt-6">
          <PlaceholderCard
            icon={Volume2}
            title="Áudio e narração"
            description="Voz do TTS, velocidade e comportamento contínuo são ajustados durante a leitura, no popover do Reader."
            actionHref="/biblia" actionLabel="Abrir a Bíblia"
          />
        </TabsContent>

        <TabsContent value="contemplativo" className="mt-6">
          <PlaceholderCard
            icon={Sparkles}
            title="Modo contemplativo"
            description="Tipografia ampliada, arte dinâmica e ritmos do Rosário são ajustados dentro do próprio módulo de oração."
            actionHref="/oracao/rosario" actionLabel="Abrir o Rosário"
          />
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-6">
          <PlaceholderCard
            icon={BellRing}
            title="Notificações"
            description="Lembretes rituais, push e WhatsApp são configurados na tela de Perfil."
            actionHref="/conta/perfil" actionLabel="Configurar lembretes"
          />
        </TabsContent>

        <TabsContent value="privacidade" className="mt-6">
          <PlaceholderCard
            icon={ShieldCheck}
            title="Privacidade e dados"
            description="Suas notas, diário e favoritos são privados (RLS por usuário). Para exportar ou excluir dados, contate o suporte."
            actionHref="/contato" actionLabel="Falar com o suporte"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
