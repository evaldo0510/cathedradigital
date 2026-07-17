/**
 * Contratos de tipos do Ambiente Átrio.
 * Fonte: docs/cathedra-2.0/ATRIUM-CONTRACT.md v1.1.
 *
 * Este arquivo NÃO importa nada de outros ambientes.
 * Todo dado externo entra através de `services/` na Fase 6.
 */

/** §6 do contrato — 9 estados possíveis do Átrio. */
export type AtriumState =
  | 'anonymous'                // E1 — sem sessão
  | 'authenticated_empty'      // usuário novo, sem histórico
  | 'authenticated_active'     // estado canônico
  | 'resume'                   // E4 — ?resume=1
  | 'notification'             // E6 — ?src=notif
  | 'prayer_mode'              // Modo Prece ativo
  | 'offline'                  // sem rede
  | 'error'                    // falha de fetch
  | 'continue_journey';        // E9 — "Continuar minha caminhada"

/** §6b do contrato — perfil declarado do usuário. */
export type AtriumProfile =
  | 'visitor'
  | 'recurrent'
  | 'catechist'
  | 'priest'
  | 'seminarian';

/** §6c do contrato — blocos priorizados P0..P6. */
export type AtriumBlock =
  | 'continue_journey'         // P0
  | 'universal_search'         // P1
  | 'theme_entry'              // P2
  | 'daily_liturgy'            // P3
  | 'five_environments'        // P4
  | 'recommendations'          // P5
  | 'announcements';           // P6

/** Item de "Continuar minha caminhada" (§6, Estado 9). */
export interface ResumeItem {
  id: string;
  kind: 'reading' | 'study' | 'formation' | 'lectio' | 'note' | 'prayer';
  label: string;                 // ex.: "Continue João 6"
  targetPath: string;            // rota destino (opaca ao Átrio)
  progressPct?: number;          // 0..100 se aplicável
  lastActivityAt: string;        // ISO
}

/** Cinco ambientes de destino (§3 do contrato). */
export type AtriumExit =
  | 'estudar'
  | 'rezar'
  | 'formar-se'
  | 'pesquisar'
  | 'minha-jornada';

/** Contexto litúrgico mínimo (§11 — consumido, não gerado). */
export interface LiturgicalContext {
  season: string;                // ex.: "Tempo Comum"
  weekday: string;               // ex.: "sexta-feira"
  colorToken: string;            // token do DS (não hex)
  saintOfDay?: { name: string; title?: string; slug?: string };
}

/** Snapshot completo consumido por `AtriumPage`. */
export interface AtriumSnapshot {
  state: AtriumState;
  profile: AtriumProfile;
  displayName?: string;
  liturgical: LiturgicalContext | null;
  resumeItems: ResumeItem[];     // máx. 3 (§6 Estado 9)
  blocksOrder: AtriumBlock[];    // já resolvido pelas regras §6b + §6c
}
