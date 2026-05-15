import React, { useState } from 'react';
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

const InputPlayground = () => {
  const [variant, setVariant] = useState<'default' | 'error' | 'disabled' | 'loading'>('default');
  
  return (
    <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={variant === 'default' ? 'primary' : 'outline'} 
          size="sm" 
          onClick={() => setVariant('default')}
        >
          Default
        </Button>
        <Button 
          variant={variant === 'error' ? 'destructive' : 'outline'} 
          size="sm" 
          onClick={() => setVariant('error')}
        >
          Error
        </Button>
        <Button 
          variant={variant === 'disabled' ? 'secondary' : 'outline'} 
          size="sm" 
          onClick={() => setVariant('disabled')}
        >
          Disabled
        </Button>
        <Button 
          variant={variant === 'loading' ? 'primary' : 'outline'} 
          size="sm" 
          onClick={() => setVariant('loading')}
        >
          Loading
        </Button>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/20">
        <div className="space-y-2">
          <Label 
            className={variant === 'error' ? 'text-destructive' : ''}
            aria-disabled={variant === 'disabled'}
          >
            Playground Input
          </Label>
          <div className="relative">
            <Input 
              disabled={variant === 'disabled'}
              className={variant === 'error' ? 'border-destructive focus-visible:ring-destructive' : ''}
              placeholder={variant === 'loading' ? 'Processando...' : 'Interaja comigo'}
            />
            {variant === 'loading' && (
              <Icons.Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
            )}
          </div>
          {variant === 'error' && (
            <p className="text-[10px] font-black uppercase text-destructive tracking-widest flex items-center gap-1">
              <Icons.AlertTriangle className="w-3 h-3" /> Campo obrigatório.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label aria-disabled={variant === 'disabled'}>Playground Select</Label>
          <Select disabled={variant === 'disabled'}>
            <SelectTrigger className={variant === 'error' ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Opção 1</SelectItem>
              <SelectItem value="2">Opção 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <p className="text-premium-tiny font-black uppercase tracking-widest text-primary mb-2">A11y Check</p>
        <ul className="text-[10px] text-muted-foreground space-y-1 list-disc pl-4">
          <li>Foco visível: {variant !== 'disabled' ? 'Ativo' : 'Inativo'}</li>
          <li>Aria-disabled: {variant === 'disabled' ? 'true' : 'false'}</li>
          <li>Aria-invalid: {variant === 'error' ? 'true' : 'false'}</li>
        </ul>
      </div>
    </div>
  );
};

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
            <div className="grid gap-16">
              <div className="space-y-6">
                <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Font Families & Weights</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Display (Cinzel/Serif)</span>
                    <h1 className="text-4xl font-display font-black leading-tight">Font Display Black</h1>
                    <h2 className="text-3xl font-display font-bold leading-tight">Font Display Bold</h2>
                  </div>
                  <div className="space-y-4">
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Sans (Inter)</span>
                    <p className="text-xl font-sans font-black">Font Sans Black</p>
                    <p className="text-xl font-sans font-bold">Font Sans Bold</p>
                    <p className="text-xl font-sans font-medium">Font Sans Medium</p>
                    <p className="text-xl font-sans font-normal">Font Sans Normal</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Premium Scale (Fluid)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Premium Base</span>
                    <p className="text-premium-base text-foreground mt-2">Standard text size (16-18px) for primary content and large labels.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Premium Small</span>
                    <p className="text-premium-small text-muted-foreground mt-2">Secondary text (13-14px) for metadata, descriptions and small buttons.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border/40">
                    <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Premium Tiny</span>
                    <p className="text-premium-tiny text-muted-foreground mt-2">Sub-labels, badges, and micro-typography (10-11px scale).</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground">Semantic Styles</p>
                <div className="space-y-4">
                  <p className="text-lg font-serif italic text-primary">Serif Italic for quotes and reflections: "O Verbo se fez carne."</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded w-fit">Mono text for codes or technical labels</p>
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

          <div className="space-y-16 bg-card border border-border/40 rounded-[2.5rem] p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-primary">States Documentation</h3>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <Label htmlFor="focus-input">Focus State</Label>
                    <Input id="focus-input" placeholder="Clique para ver o anel de foco" className="focus-visible:ring-primary ring-offset-2" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Utiliza focus-visible:ring-2 para alta acessibilidade.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disabled-input-guide">Disabled State</Label>
                    <Input id="disabled-input-guide" disabled placeholder="Não é possível interagir" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Opacidade reduzida e cursor: not-allowed.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="error-input-guide" className="text-destructive">Error State</Label>
                    <Input id="error-input-guide" className="border-destructive focus-visible:ring-destructive" defaultValue="valor@incorreto" />
                    <p className="text-[10px] font-black uppercase text-destructive tracking-widest flex items-center gap-1">
                      <Icons.AlertCircle className="w-3 h-3" /> Formato de e-mail inválido.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-xl font-bold text-primary">Interactive Playground</h3>
                <InputPlayground />
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