import React, { forwardRef } from 'react';

export const COLORS = {
  primary: '#1a1a1a',
  secondary: '#d4af37',
  accent: '#8b0000',
  background: '#fdfcf8',
};

export const Logo = forwardRef<HTMLDivElement, { className?: string }>(({ className = "w-12 h-12" }, ref) => (
  <div ref={ref} className={`relative flex items-center justify-center group ${className}`}>
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c547" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id="logo-grad-light" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0d56c" />
          <stop offset="100%" stopColor="#c9a227" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" stroke="url(#logo-grad)" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="60" r="50" fill="#1a1a1a" />
      <line x1="60" y1="22" x2="60" y2="98" stroke="url(#logo-grad)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M60 22 C60 22, 82 24, 82 40 C82 54, 60 56, 60 56" stroke="url(#logo-grad)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <line x1="38" y1="34" x2="82" y2="78" stroke="url(#logo-grad-light)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="82" y1="34" x2="38" y2="78" stroke="url(#logo-grad-light)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <circle cx="60" cy="8" r="1.5" fill="#d4af37" opacity="0.5" />
      <circle cx="60" cy="112" r="1.5" fill="#d4af37" opacity="0.5" />
      <circle cx="8" cy="60" r="1.5" fill="#d4af37" opacity="0.5" />
      <circle cx="112" cy="60" r="1.5" fill="#d4af37" opacity="0.5" />
    </svg>
  </div>
));

Logo.displayName = 'Logo';

const createIcon = (d: string, viewBox = "0 0 24 24", fill = "none", stroke = "currentColor") => 
  forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} fill={fill} viewBox={viewBox} stroke={stroke} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  ));

/* ── Navigation Icons (custom sacred-themed SVGs) ── */
const NavIcons = {
  /** Cathedral / Home — stylised facade with rose window */
  Cathedral: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L3 10v11a1 1 0 001 1h16a1 1 0 001-1V10L12 2z" />
      <path d="M12 6v4M10 8h4" />
      <circle cx="12" cy="14" r="2.5" />
      <path d="M9 22v-5h6v5" />
    </svg>
  )),
  /** Holy Bible — book with cross bookmark */
  HolyBible: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
      <path d="M12 6v6M10 8h4" />
      <path d="M16 2v4l-1.5-1L13 6V2" />
    </svg>
  )),
  /** Praying Hands — folded hands for prayer section */
  PrayingHands: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3c0 0-3 4-3 8v4l-2 3" />
      <path d="M12 3c0 0 3 4 3 8v4l2 3" />
      <path d="M9 11c0 0 1.5 1 3 1s3-1 3-1" />
      <path d="M7 18l2 3h6l2-3" />
      <path d="M10 14v2M14 14v2" />
    </svg>
  )),
  /** Catechism Shield — shield with cross for doctrine */
  CatechismShield: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6L12 2z" />
      <path d="M12 7v6M9 10h6" />
    </svg>
  )),
  /** Rosary — circle with beads and cross */
  Rosary: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="10" r="7" />
      <circle cx="12" cy="3" r="0.8" fill="currentColor" />
      <circle cx="5.5" cy="7" r="0.8" fill="currentColor" />
      <circle cx="5.5" cy="13" r="0.8" fill="currentColor" />
      <circle cx="18.5" cy="7" r="0.8" fill="currentColor" />
      <circle cx="18.5" cy="13" r="0.8" fill="currentColor" />
      <path d="M12 17v2M11 19h2M12 21v1" />
    </svg>
  )),
  /** Chalice — liturgy/mass symbol */
  Chalice: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2h8l-1 8a3 3 0 01-6 0L8 2z" />
      <path d="M12 12v5" />
      <path d="M8 21h8" />
      <path d="M10 17h4" />
      <path d="M6 2h12" />
    </svg>
  )),
  /** Calendar Cross — liturgical calendar */
  LiturgicalCalendar: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 14v4M10 16h4" />
    </svg>
  )),
  /** Via Crucis — cross with path */
  ViaCrucis: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20M8 6h8" />
      <path d="M4 22l4-6M20 22l-4-6" />
    </svg>
  )),
  /** Scroll — for magisterium/documents */
  Scroll: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 21h12a2 2 0 002-2V5a2 2 0 00-2-2H8" />
      <path d="M8 3a2 2 0 00-2 2v14a2 2 0 002 2" />
      <path d="M4 5a2 2 0 012-2h0a2 2 0 012 2v0" />
      <path d="M4 19a2 2 0 012 2h0a2 2 0 012-2v0" />
      <path d="M11 8h6M11 12h6M11 16h4" />
    </svg>
  )),
  /** Saint Halo — for saints section */
  SaintHalo: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="5" ry="2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M8 19c0-2.2 1.8-4 4-4s4 1.8 4 4v2H8v-2z" />
    </svg>
  )),
  /** Dove — Holy Spirit / Colloquium */
  Dove: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 8c-2-3-6-3-8-1 2 0 3 2 3 4l5 5 5-5c0-2 1-4 3-4-2-2-6-2-8 1z" />
      <path d="M12 13v5" />
      <path d="M9 20h6" />
    </svg>
  )),
};

export const Icons = {
  ...NavIcons,
  Home: createIcon("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"),
  Book: createIcon("M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"),
  Search: createIcon("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"),
  Cross: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M11 2h2v7h7v2h-7v11h-2v-11h-7v-2h7v-7z" /></svg>
  )),
  Feather: createIcon("M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"),
  History: createIcon("M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"),
  Menu: createIcon("M4 6h16M4 12h16M4 18h16"),
  Users: createIcon("M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"),
  Audio: createIcon("M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"),
  Stop: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} fill="currentColor" viewBox="0 0 24 24" {...props}><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
  )),
  Layout: createIcon("M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"),
  Globe: createIcon("M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"),
  ExternalLink: createIcon("M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"),
  Pin: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12ZM8.8 14L10 12.8V4H14V12.8L15.2 14H8.8Z" /></svg>
  )),
  Star: createIcon("M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"),
  Heart: createIcon("M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"),
  Message: createIcon("M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"),
  ArrowDown: createIcon("M19 9l-7 7-7-7"),
  Handshake: createIcon("M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-0.5a3 3 0 00-1.5 2.597M17 11.5V14m0-2.5v-6a1.5 1.5 0 10-3 0V12m3-0.5a3 3 0 011.5 2.597M9 10h4M9 14h4m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z"),
  Download: createIcon("M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"),
  BookOpen: createIcon("M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"),
  RotateCcw: createIcon("M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"),
  Zap: createIcon("M13 10V3L4 14h7v7l9-11h-7z"),
  Instagram: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2}/><path strokeWidth={2} d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01"/></svg>
  )),
  Facebook: createIcon("M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"),
  Twitter: createIcon("M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"),
  Whatsapp: createIcon("M3 12c0 1.657.412 3.218 1.134 4.586L3 21l4.557-1.134C8.92 20.588 10.407 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9z"),
  Youtube: forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 00-1.94 2C1 8.11 1 12 1 12s0 3.89.46 5.58a2.78 2.78 0 001.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 001.94-2C23 15.89 23 12 23 12s0-3.89-.46-5.58z" /><path fill="currentColor" d="M9.75 15.02l5.75-3.02-5.75-3.02v6.04z" /></svg>
  )),
};