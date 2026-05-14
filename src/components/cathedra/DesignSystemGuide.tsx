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

        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
              Button Variants
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60">Default / Primary</h3>
              <div className="flex flex-col gap-4">
                <Button>Standard Button</Button>
                <Button isLoading>Loading State</Button>
                <Button disabled>Disabled Button</Button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60">Outline</h3>
              <div className="flex flex-col gap-4">
                <Button variant="outline">Outline Button</Button>
                <Button variant="outline" isLoading>Loading State</Button>
                <Button variant="outline" disabled>Disabled Button</Button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60">Destructive</h3>
              <div className="flex flex-col gap-4">
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="destructive" isLoading>Loading State</Button>
                <Button variant="destructive" disabled>Disabled Button</Button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60">Ghost</h3>
              <div className="flex flex-col gap-4">
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="ghost" isLoading>Loading State</Button>
                <Button variant="ghost" disabled>Disabled Button</Button>
              </div>
            </div>

             <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60">Secondary</h3>
              <div className="flex flex-col gap-4">
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="secondary" isLoading>Loading State</Button>
                <Button variant="secondary" disabled>Disabled Button</Button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60">Icon Only</h3>
              <div className="flex flex-wrap gap-4">
                <Button size="icon"><Icons.Search /></Button>
                <Button size="icon" variant="outline"><Icons.Compass /></Button>
                <Button size="icon" variant="ghost"><Icons.Menu /></Button>
                <Button size="icon" isLoading />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
              Button Sizes
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Small (sm)</p>
              <Button size="sm">Action</Button>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Default</p>
              <Button>Standard Action</Button>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Large (lg)</p>
              <Button size="lg">Prominent Call to Action</Button>
            </div>
          </div>
        </section>

        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
              Real World Usage
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="bg-muted/30 rounded-[2.5rem] p-8 md:p-12 border border-border/40 space-y-8">
            <div className="max-w-md">
              <h4 className="font-serif text-2xl mb-4">Continue sua Jornada</h4>
              <p className="text-sm text-muted-foreground mb-8">Continue de onde parou e aprofunde seu conhecimento na fé católica com trilhas personalizadas.</p>
              <Button variant="primary" className="w-full md:w-auto">Continuar Caminhada</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemGuide;