import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';

const DesignSystemGuide = () => {
  return (
    <div className="desktop-layout py-12 md:py-20">
      <div className="desktop-main content-section space-y-20">
        <header className="space-y-4">
          <p className="text-premium-tiny font-black uppercase tracking-[0.4em] text-secondary">Design System</p>
          <h1 className="text-4xl md:text-6xl font-display font-black text-primary leading-tight">
            Cathedra <span className="text-secondary">Visual Identity</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A consolidated UI language focused on a premium, minimalist, and contemplative experience.
          </p>
        </header>

        {/* Button Documentation Section */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
              Button Component
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="space-y-16">
            {/* Variants */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-primary">Variants</h3>
              <p className="text-sm text-muted-foreground">Standardized button styles for different semantic purposes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary (Default)</p>
                  <Button className="w-full">Primary Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secondary</p>
                  <Button variant="secondary" className="w-full">Secondary Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outline</p>
                  <Button variant="outline" className="w-full">Outline Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ghost</p>
                  <Button variant="ghost" className="w-full">Ghost Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destructive</p>
                  <Button variant="destructive" className="w-full">Destructive Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Link</p>
                  <Button variant="link" className="w-full">Link Action</Button>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-primary">Sizes</h3>
              <div className="flex flex-col md:flex-row items-end gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Small (sm)</p>
                  <Button size="sm">Small Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Default</p>
                  <Button>Default Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Large (lg)</p>
                  <Button size="lg">Large Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Icon Only</p>
                  <div className="flex gap-4">
                    <Button size="icon"><Icons.Plus /></Button>
                    <Button size="icon" variant="outline"><Icons.Search /></Button>
                    <Button size="icon" variant="ghost"><Icons.Menu /></Button>
                  </div>
                </div>
              </div>
            </div>

            {/* States */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-primary">States</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading State</p>
                  <div className="flex flex-col gap-4">
                    <Button isLoading>Loading Primary</Button>
                    <Button variant="outline" isLoading>Loading Outline</Button>
                    <Button size="icon" isLoading />
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Disabled State</p>
                  <div className="flex flex-col gap-4">
                    <Button disabled>Disabled Primary</Button>
                    <Button variant="outline" disabled>Disabled Outline</Button>
                    <Button size="icon" disabled><Icons.Lock /></Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acessibilidade</p>
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border/40 text-[11px] space-y-2">
                    <p>• <strong>aria-busy:</strong> Automático quando isLoading=true</p>
                    <p>• <strong>aria-disabled:</strong> Automático quando isLoading ou disabled</p>
                    <p>• <strong>Focus:</strong> Ring de alta visibilidade no teclado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real World Usage */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
              Real World Usage
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-muted/30 rounded-[2.5rem] p-8 border border-border/40 space-y-6">
              <div className="space-y-3">
                <h4 className="font-serif text-2xl">Continue sua Jornada</h4>
                <p className="text-sm text-muted-foreground">Continue de onde parou e aprofunde seu conhecimento na fé católica com trilhas personalizadas.</p>
              </div>
              <Button variant="primary" className="w-full">Continuar Caminhada</Button>
            </div>
            
            <div className="bg-card border border-border/40 rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-6">
              <div className="p-4 rounded-full bg-secondary/10 text-secondary">
                <Icons.Bell className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="font-serif text-2xl">Notificações</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Ative para receber avisos sobre novas leituras e eventos da Igreja.</p>
              </div>
              <div className="flex gap-4 w-full">
                <Button variant="outline" className="flex-1">Agora não</Button>
                <Button className="flex-1">Ativar</Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemGuide;
