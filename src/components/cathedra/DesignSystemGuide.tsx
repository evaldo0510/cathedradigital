import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

        {/* Typography Section */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
              Typography Scale
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="space-y-12 bg-card border border-border/40 rounded-[2.5rem] p-8 md:p-12">
            <div className="grid gap-12">
              <div className="space-y-4">
                <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Display Titles (H1, H2, H3)</p>
                <div className="space-y-6">
                  <div>
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Heading 1 (H1)</span>
                    <h1 className="mt-1">O Verbo se fez carne</h1>
                  </div>
                  <div>
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Heading 2 (H2)</span>
                    <h2>A Beleza da Tradição</h2>
                  </div>
                  <div>
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Heading 3 (H3)</span>
                    <h3>Oração e Contemplação</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Premium Small Scale</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Premium Base</span>
                    <p className="text-premium-base text-foreground mt-2">Standard text size for primary content and large labels.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Premium Small</span>
                    <p className="text-premium-small text-muted-foreground mt-2">Secondary text for metadata, descriptions and small buttons.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Premium Tiny</span>
                    <p className="text-premium-tiny text-muted-foreground mt-2">Sub-labels, badges, and micro-typography (9-11px scale).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Primary (Default)</p>
                  <Button className="w-full">Primary Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Secondary</p>
                  <Button variant="secondary" className="w-full">Secondary Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Outline</p>
                  <Button variant="outline" className="w-full">Outline Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Ghost</p>
                  <Button variant="ghost" className="w-full">Ghost Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Destructive</p>
                  <Button variant="destructive" className="w-full">Destructive Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Link</p>
                  <Button variant="link" className="w-full">Link Action</Button>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-primary">Sizes</h3>
              <div className="flex flex-col md:flex-row items-end gap-12">
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Small (sm)</p>
                  <Button size="sm">Small Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Default</p>
                  <Button>Default Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Large (lg)</p>
                  <Button size="lg">Large Action</Button>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Icon Only</p>
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
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Loading State</p>
                  <div className="flex flex-col gap-4">
                    <Button isLoading>Loading Primary</Button>
                    <Button variant="outline" isLoading>Loading Outline</Button>
                    <Button size="icon" isLoading />
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Disabled State</p>
                  <div className="flex flex-col gap-4">
                    <Button disabled>Disabled Primary</Button>
                    <Button variant="outline" disabled>Disabled Outline</Button>
                    <Button size="icon" disabled><Icons.Lock /></Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Acessibilidade</p>
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border/40 text-premium-small space-y-2">
                    <p>• <strong>aria-busy:</strong> Automático quando isLoading=true</p>
                    <p>• <strong>aria-disabled:</strong> Automático quando isLoading ou disabled</p>
                    <p>• <strong>Focus:</strong> Ring de alta visibilidade no teclado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
              Color Palette & Contrast
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <div className="h-24 rounded-3xl bg-primary border border-border/40" />
              <div>
                <p className="text-sm font-bold">Primary (Blue)</p>
                <p className="text-premium-tiny text-muted-foreground">hsl(var(--primary))</p>
                <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest">
                  WCAG AAA Pass
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-24 rounded-3xl bg-secondary border border-border/40" />
              <div>
                <p className="text-sm font-bold">Secondary (Gold)</p>
                <p className="text-premium-tiny text-muted-foreground">hsl(var(--secondary))</p>
                <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest">
                  WCAG AA Pass
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-24 rounded-3xl bg-background border border-border/40" />
              <div>
                <p className="text-sm font-bold">Background</p>
                <p className="text-premium-tiny text-muted-foreground">hsl(var(--background))</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-24 rounded-3xl bg-card border border-border/40" />
              <div>
                <p className="text-sm font-bold">Card</p>
                <p className="text-premium-tiny text-muted-foreground">hsl(var(--card))</p>
              </div>
            </div>
          </div>
        </section>

        {/* Inputs & Selects Section */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
              Inputs & Selects
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-primary">Text Inputs</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default-input">Default Input</Label>
                  <Input id="default-input" placeholder="Digite seu nome..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled-input">Disabled Input</Label>
                  <Input id="disabled-input" disabled placeholder="Campo desabilitado" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="error-input" className="text-destructive">Error State</Label>
                  <Input id="error-input" className="border-destructive focus-visible:ring-destructive" defaultValue="Valor inválido" />
                  <p className="text-[10px] font-black uppercase text-destructive tracking-widest">O e-mail informado é inválido.</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-xl font-bold text-primary">Dropdown Selects</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Default Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Opção 1</SelectItem>
                      <SelectItem value="2">Opção 2</SelectItem>
                      <SelectItem value="3">Opção 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Disabled Select</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Desabilitado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Opção 1</SelectItem>
                    </SelectContent>
                  </Select>
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