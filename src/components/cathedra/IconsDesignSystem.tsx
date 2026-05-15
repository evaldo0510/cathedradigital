import React from 'react';
import { CathedraIcon, IconSize, IconSizePreset } from './CathedraIcon';
import { Icons } from '@/constants';
import { Card as CathedraCard, CardHeader, CardTitle, CardContent } from './CathedraCard';

const sizes: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

const IconsDesignSystem: React.FC = () => {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-12 px-6">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-premium-balance">Icon System Audit</h1>
        <p className="text-muted-foreground text-lg">Visual regression target for verifying icon proportions across breakpoints.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {sizes.map((size) => (
          <CathedraCard key={size} variant="glass" padding="md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="uppercase tracking-widest text-primary/60 text-sm">Size: {size.toUpperCase()}</CardTitle>
              <code className="text-xs bg-muted px-2 py-1 rounded">Preset.{size}</code>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-12 pt-4">
                <div className="flex flex-col items-center gap-3">
                  <CathedraIcon icon={Icons.Home} size={size} variant="primary" />
                  <span className="text-[10px] font-bold text-muted-foreground">Primary</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <CathedraIcon icon={Icons.Cross} size={size} variant="secondary" />
                  <span className="text-[10px] font-bold text-muted-foreground">Secondary</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <CathedraIcon icon={Icons.Settings} size={size} variant="muted" />
                  <span className="text-[10px] font-bold text-muted-foreground">Muted</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <CathedraIcon icon={Icons.ShieldCheck} size={size} variant="default" />
                  <span className="text-[10px] font-bold text-muted-foreground">Default</span>
                </div>
              </div>
            </CardContent>
          </CathedraCard>
        ))}
      </div>

      <CathedraCard variant="outline" padding="md">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-widest">Icon Presets Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(IconSizePreset).map(([name, size]) => (
              <div key={name} className="flex flex-col items-center gap-4 p-4 border border-primary/5 rounded-2xl bg-primary/[0.01]">
                <CathedraIcon icon={Icons.Star} size={size as IconSize} variant="primary" />
                <div className="text-center">
                  <p className="text-xs font-bold text-primary/80">{name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{size}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </CathedraCard>
    </div>
  );
};

export default IconsDesignSystem;
