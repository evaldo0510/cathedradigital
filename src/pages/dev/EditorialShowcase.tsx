/**
 * Editorial Showcase — Sprint E1 (dev-only).
 * Rota: /dev/editorial
 *
 * Storybook mínimo de todas as primitivas Editorial* para inspeção
 * visual e validação de contraste/acessibilidade antes de qualquer
 * migração de página. Nenhuma lógica de domínio.
 */

import React from 'react';
import {
  EditorialShell,
  EditorialHero,
  EditorialSection,
  EditorialHeader,
  EditorialDivider,
  EditorialSurface,
  EditorialCard,
  EditorialGrid,
  EditorialShelf,
  EditorialFooter,
  EditorialReaderHeader,
  EditorialKicker,
  EditorialMeta,
  EditorialGoldMarker,
  EditorialProgress,
  EditorialQuote,
  EditorialMarginalia,
  EditorialEmptyState,
  EditorialBreadcrumb,
  EditorialCTA,
  EditorialPanel,
  EditorialBookCover,
  EditorialTimeline,
  EditorialChapterCard,
} from '@/components/editorial';

const Block: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <section className="py-10 border-t border-stitch-outline-variant/40">
    <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.32em] text-stitch-secondary mb-6">
      {label}
    </p>
    <div>{children}</div>
  </section>
);

const EditorialShowcase: React.FC = () => {
  return (
    <EditorialShell parchment>
      <EditorialHero
        meta="Sprint E1 · fundação"
        kicker="Design System"
        title={<>Editorial<span className="italic"> Primitives</span></>}
        subtitle="Storybook mínimo de todas as primitivas visuais. Consumo apenas de tokens stitch-*."
        action={<EditorialCTA>Ver documentação</EditorialCTA>}
      />

      <Block label="Kicker · Meta · Divider">
        <div className="flex flex-col gap-4">
          <EditorialKicker>Acervo Católico</EditorialKicker>
          <EditorialKicker tone="muted">Metadata</EditorialKicker>
          <EditorialMeta>Última atualização · Hoje</EditorialMeta>
          <EditorialDivider variant="hair" />
          <EditorialDivider variant="gold" className="max-w-[80px]" />
          <EditorialDivider variant="gold-fade" className="max-w-[240px]" />
          <EditorialGoldMarker />
        </div>
      </Block>

      <Block label="Progress">
        <div className="flex flex-col gap-8 max-w-md">
          <EditorialProgress value={12} label="Capítulo 2 de 22" />
          <EditorialProgress value={68} label="Retomar leitura" />
          <EditorialProgress value={100} label="Concluído" />
        </div>
      </Block>

      <Block label="Quote · Marginalia">
        <div className="flex flex-col gap-8 max-w-2xl">
          <EditorialQuote cite="Santo Agostinho, Confissões X, 27">
            Tarde te amei, Beleza tão antiga e tão nova, tarde te amei.
          </EditorialQuote>
          <div className="flex flex-col gap-4">
            <EditorialMarginalia marker="§ 1" markerAriaLabel="Parágrafo 1">
              No princípio, Deus criou os céus e a terra.
            </EditorialMarginalia>
            <EditorialMarginalia marker="§ 2">
              A terra estava sem forma e vazia; as trevas cobriam o abismo.
            </EditorialMarginalia>
          </div>
        </div>
      </Block>

      <Block label="Breadcrumb">
        <EditorialBreadcrumb
          items={[
            { label: 'Biblioteca', href: '#' },
            { label: 'Sagrada Escritura', href: '#' },
            { label: 'João 6' },
          ]}
        />
      </Block>

      <Block label="CTA">
        <div className="flex flex-wrap gap-8 items-center">
          <EditorialCTA>Retomar leitura</EditorialCTA>
          <EditorialCTA as="a" href="#">Explorar acervo</EditorialCTA>
        </div>
      </Block>

      <Block label="EmptyState">
        <EditorialSurface tier="lowest" className="p-6">
          <EditorialEmptyState
            kicker="Silêncio contemplativo"
            title="Ainda não há registros neste acervo."
            description="Adicione uma leitura, um destaque ou uma referência para começar."
            action={<EditorialCTA>Começar</EditorialCTA>}
          />
        </EditorialSurface>
      </Block>

      <Block label="Panel (Nexus / popover)">
        <div className="max-w-md">
          <EditorialPanel
            kicker="Nexus Theologicus"
            title="João 6 · Discurso do Pão"
            subtitle="Referências cruzadas neste capítulo"
            onClose={() => undefined}
            footer={<EditorialCTA>Abrir referência</EditorialCTA>}
          >
            <p>
              O discurso eucarístico de João 6 dialoga com o Êxodo 16, o
              Catecismo §§1333-1336 e o tratado <em>Corpus Christi</em> de
              São Tomás de Aquino.
            </p>
          </EditorialPanel>
        </div>
      </Block>

      <Block label="BookCover (3D + linho)">
        <div className="flex flex-wrap items-end gap-8">
          <EditorialBookCover size="sm" title="Confissões" author="Agostinho" />
          <EditorialBookCover
            size="md"
            title="Suma Teológica"
            author="Tomás de Aquino"
            color="hsl(var(--stitch-tertiary))"
          />
          <EditorialBookCover size="lg" title="Imitação de Cristo" author="Kempis" />
        </div>
      </Block>

      <Block label="Timeline · ChapterCard">
        <EditorialTimeline>
          <EditorialChapterCard
            state="done"
            numeral="I"
            kicker="Dia 1"
            title="A escuta"
            description="O primeiro movimento é aprender a ouvir."
            meta="12 min de leitura"
          />
          <EditorialChapterCard
            state="current"
            numeral="II"
            kicker="Dia 2"
            title="A resposta"
            description="Do silêncio nasce a resposta livre."
            meta="18 min · em andamento"
            action={<EditorialCTA>Retomar</EditorialCTA>}
          />
          <EditorialChapterCard
            numeral="III"
            kicker="Dia 3"
            title="A oferta"
            description="A resposta se torna oferta de si mesmo."
            meta="15 min"
          />
        </EditorialTimeline>
      </Block>

      <Block label="Existentes (regressão visual)">
        <EditorialReaderHeader
          kicker="Sagrada Escritura · Evangelho"
          title={<>João · <span className="italic">Capítulo 6</span></>}
          subtitle="Novo Testamento · São João Apóstolo"
          meta="§ 1 – 71 · 40 min"
        />
        <EditorialHeader
          kicker="Descobertas"
          title="Da mesa do bibliotecário"
          action={<EditorialCTA>Ver todas</EditorialCTA>}
        />
        <div className="mt-8">
          <EditorialGrid cols={3}>
            <EditorialCard
              kicker="Patrística"
              title="De Trinitate"
              description="Santo Agostinho examina o mistério trinitário."
              meta="Séc. IV"
            />
            <EditorialCard
              kicker="Escolástica"
              title="Suma contra os Gentios"
              description="Um tratado missionário e filosófico."
              meta="Séc. XIII"
            />
            <EditorialCard
              kicker="Moderna"
              title="Introdução à vida devota"
              description="Um caminho para leigos."
              meta="Séc. XVII"
            />
          </EditorialGrid>
        </div>
        <div className="mt-10">
          <EditorialShelf itemMinWidth="180px">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <EditorialBookCover
                key={n}
                size="md"
                title={`Volume ${n}`}
                author="Autor"
              />
            ))}
          </EditorialShelf>
        </div>
      </Block>

      <EditorialFooter
        kicker="Cathedra Digital"
        note="Design System · Sprint E1"
        action={<EditorialCTA>Documentação</EditorialCTA>}
      />
    </EditorialShell>
  );
};

export default EditorialShowcase;
