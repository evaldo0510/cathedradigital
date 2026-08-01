/**
 * Reader Template Master — API canônica.
 *
 * Import único para toda leitura da Cathedra. Módulos NÃO devem
 * importar Reader/Nexus/Popover fora deste barrel.
 *
 * Uso canônico:
 *
 *   import {
 *     ReaderShell,
 *     ReferencePopover,
 *     NexusPanel,
 *     ReaderContinuation,
 *   } from '@/components/reader';
 *
 *   <ReaderShell
 *     hero={<EditorialHero .../>}
 *     nexus={<NexusPanel output={nexus} />}
 *     continuation={<ReaderContinuation .../>}
 *   >
 *     <ReaderContent> ... <ReferencePopover .../> ... </ReaderContent>
 *   </ReaderShell>
 */

export { ReaderShell, type ReaderShellProps } from './ReaderShell';
export { ReaderToolbar, type ReaderToolbarProps } from './ReaderToolbar';
export {
  ReferencePopover,
  type ReferencePopoverProps,
  type ReferenceKind,
} from './ReferencePopover';
export {
  HeaderContext,
  LiturgicalContext,
  JourneyContext,
  CatechesisContext,
  StudyContext,
  PrayerContext,
  type HeaderContextProps,
  type LiturgicalContextProps,
  type JourneyContextProps,
  type CatechesisContextProps,
  type StudyContextProps,
  type PrayerContextProps,
} from './HeaderContext';

export {
  EditorialClosure,
  type EditorialClosureProps,
  type EditorialClosureNexusItem,
} from './EditorialClosure';

export { NexusPanel, type NexusPanelProps } from '@/components/nexus/NexusPanel';
export { default as ReaderContinuation } from '@/components/shared/ReaderContinuation';
export { EditorialHero } from '@/components/editorial';

