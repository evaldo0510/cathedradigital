import React from 'react';

interface ContentCardProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  variant?: 'default' | 'highlight' | 'minimal';
}

const ContentCard: React.FC<ContentCardProps> = ({ icon, title, description, action, onClick, variant = 'default' }) => {
  if (variant === 'minimal') {
    return (
      <button onClick={onClick} className="flex items-center gap-4 p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl hover:border-[#d4af37] transition-all text-left group">
        <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{icon}</div>
        <div>
          <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100">{title}</h4>
          <p className="text-xs text-stone-400 line-clamp-1">{description}</p>
        </div>
      </button>
    );
  }

  return (
    <div
    className={`rounded-2xl border p-5 md:p-6 transition-all duration-500 flex flex-col h-full group cursor-pointer
        ${variant === 'highlight'
          ? 'bg-stone-950 border-stone-800 text-white shadow-[0_35px_70px_-15px_rgba(0,0,0,0.1)] scale-[1.01]'
          : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 hover:shadow-xl hover:border-[#d4af37]/30 hover:-translate-y-1'}`}
      onClick={onClick}
    >
      <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform origin-left">{icon}</div>
      <h2 className="text-lg md:text-xl font-serif font-bold mb-2 tracking-tight leading-tight">{title}</h2>
      <p className={`text-sm mb-6 flex-1 leading-relaxed ${variant === 'highlight' ? 'text-stone-400 italic' : 'text-stone-500 font-serif italic'}`}>{description}</p>
      <button className={`w-fit px-6 py-2.5 rounded-lg font-black uppercase text-[9px] tracking-[0.2em] transition-all
        ${variant === 'highlight'
          ? 'bg-[#d4af37] text-stone-900 hover:bg-white shadow-xl shadow-[#d4af37]/10'
          : 'bg-stone-900 dark:bg-stone-800 text-[#d4af37] group-hover:bg-[#8b0000] group-hover:text-white shadow-lg'}`}>
        {action}
      </button>
    </div>
  );
};

export default ContentCard;
