/**
 * Editorial Engine — núcleo de tipos genéricos.
 *
 * Descreve uma entidade editorial (Glossário, Santos, Orações…) como um MANIFESTO
 * que informa: tabela, campos obrigatórios, pesos, gate, macroáreas e prompts.
 * O motor executa audit → ICE → gate → nexus → generator → snapshot → certification
 * usando o manifesto — nenhum módulo precisa ter lógica própria de auditoria.
 */

export type FieldGroup = "editorial" | "nexus" | "meta";

export interface FieldSpec {
  /** Nome da coluna no banco. */
  key: string;
  /** Rótulo humano. */
  label: string;
  /** Grupo que contribui para o score respectivo (Editorial / Nexus). */
  group: FieldGroup;
  /** Se ausência/vazio bloqueia o gate. */
  required: boolean;
  /** Peso relativo no cálculo do subscore do grupo. Default 1. */
  weight?: number;
  /** Validador opcional. Retorna `true` quando o campo está "ok" para auditoria. */
  validate?: (value: unknown) => boolean;
}

export interface GateRule {
  key: string;
  label: string;
  /** Rule check recebe os totais agregados da entidade e diz se passa. */
  passes: (totals: EntityTotals) => boolean;
}

export interface EntityTotals {
  total: number;
  published: number;
  drafts: number;
  gold: number;
  silver: number;
  bronze: number;
  needs_review: number;
  avg: number;
  avg_editorial: number;
  avg_nexus: number;
  avg_weighted: number;
}

export interface EntityManifest {
  /** Identificador estável usado em `editorial_snapshots.module`, `editorial_jobs.module`, query params. */
  id: string;
  /** Rótulo humano exibido em painéis (`Glossário Teológico`, `Santos`, …). */
  label: string;
  /** Nome curto para chips/badges. */
  shortLabel: string;
  /** Tabela principal no schema public. */
  table: string;
  /** Coluna slug. */
  slugField: string;
  /** Coluna nome/título humano. */
  titleField: string;
  /** Coluna status (draft/published). */
  statusField: string;
  /** Rota do painel de auditoria (pode carregar ?entity=<id>). */
  auditRoute: string;
  /** Ícone (nome do símbolo Lucide) para uso em Mission Control. */
  icon: string;
  /** Campos rastreados pelo engine. */
  fields: FieldSpec[];
  /** Peso doutrinário do módulo dentro do ecossistema (para agregar Mission Control). */
  weight: number;
  /** Se a entidade já está plugada no engine (para Mission Control mostrar placeholder). */
  ready: boolean;
  /** Cor/marca visual (token semântico já existente). */
  accent?: string;
  /** Ciclo de vida no ecossistema (Onda 2). */
  lifecycle?: {
    version: string;
    status: "placeholder" | "developing" | "consolidating" | "certified";
    certification: boolean;
    /** Progresso de migração para o motor genérico (0–1). */
    migration: number;
  };
  /** Regras de bloqueio para o Quality Gate. */
  gate?: {
    minIce: number;
    minEditorial: number;
    minNexus: number;
    requiredFields: string[];
  };
}

export interface EntitySnapshot {
  id: string;
  module: string;
  captured_at: string;
  total: number;
  gold: number;
  silver: number;
  bronze: number;
  needs_review: number;
  avg_ice: number;
  avg_editorial: number;
  avg_nexus: number;
  gate_passing: number;
  gate_failing: number;
}
