import React from 'react';
import { Icons } from '@/constants';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 page-enter">
    <div className="w-20 h-20 rounded-3xl bg-foreground flex items-center justify-center">
      <Icons.Book className="w-10 h-10 text-primary" />
    </div>
    <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">{title}</h1>
    <p className="text-muted-foreground font-serif italic text-lg max-w-lg">{description}</p>
    <div className="px-4 py-2 border border-border rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">Em breve</div>
  </div>
);

export default PlaceholderPage;
