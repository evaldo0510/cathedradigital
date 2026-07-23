/**
 * Sprint UX · Área do Usuário — seção Perfil.
 * Wrapper que reusa a página completa existente (`ProfilePage`).
 * Não há duplicação de lógica; apenas contextualização no shell da conta.
 */
import ProfilePage from "@/components/cathedra/ProfilePage";

export default function PerfilSection() {
  return <ProfilePage />;
}
