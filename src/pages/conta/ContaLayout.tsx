/**
 * Sprint UX · Área do Usuário — shell unificado.
 *
 * Layout com sidebar organizada por grupos. Todas as rotas `/conta/*` reusam
 * os componentes existentes; rotas antigas (`/profile`, `/diario`, etc.)
 * seguem operando sem quebra.
 */
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AccountSidebar } from "./AccountSidebar";

export default function ContaLayout() {
  return (
    <SidebarProvider>
      <Helmet>
        <title>Minha Conta · Cathedra</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen flex w-full bg-background" data-space="cloister">
        <AccountSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/95 backdrop-blur px-3">
            <SidebarTrigger />
            <span className="font-serif text-sm text-muted-foreground">Minha Conta</span>
          </header>
          <section className="flex-1 min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </SidebarProvider>
  );
}
