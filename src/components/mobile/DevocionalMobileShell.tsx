/**
 * DevocionalMobileShell — Etapa M9.
 *
 * Envelopa páginas devocionais (Rosário, Via Crucis, Missal, Breviário,
 * Ladainhas, Oração) com MobileTopBar + MobileBottomNav no mobile.
 * Os shells se autolimitam a `md:hidden`, portanto o layout desktop é intacto.
 */

import React from "react";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { MobileBottomNav, type MobileNavItem } from "@/components/mobile/MobileBottomNav";
import { Home, BookOpen, Heart, Sparkles, Search } from "lucide-react";

const DEVOCIONAL_NAV: MobileNavItem[] = [
  { to: "/", label: "Átrio", icon: Home, matches: /^\/$/ },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen, matches: /^\/(biblioteca|bible|catechism|magisterium|santos)/ },
  { to: "/oracao", label: "Oração", icon: Heart, matches: /^\/(oracao|rosary|viacrucis|missal|breviary|litanies|lectio|contemplatio|liturgia)/ },
  { to: "/buscar", label: "Buscar", icon: Search, matches: /^\/buscar/ },
  { to: "/nexus", label: "Nexus", icon: Sparkles, matches: /^\/nexus/ },
];

interface Props {
  kicker?: string;
  title: string;
  children: React.ReactNode;
}

export function DevocionalMobileShell({ kicker = "Cathedra · Oração", title, children }: Props) {
  return (
    <>
      <MobileTopBar kicker={kicker} title={title} showBack transparent />
      <div className="md:pb-0 pb-24">{children}</div>
      <MobileBottomNav items={DEVOCIONAL_NAV} />
    </>
  );
}
