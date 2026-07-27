/**
 * TestimonialsSection — Depoimentos com carrossel acessível.
 *
 * Acessibilidade:
 *   - <section aria-labelledby="testimonials-heading">
 *   - Cada slide = <blockquote> com <cite>; role="group" aria-roledescription="slide"
 *   - Botões prev/next com aria-label + aria-controls
 *   - Setas ← / → do teclado avançam quando o carousel está focado (embla nativo).
 *   - Indicadores (dots) navegáveis por teclado; aria-current no ativo.
 *
 * Uso:
 *   <TestimonialsSection />                       // padrão
 *   <TestimonialsSection items={custom} />        // substituir mocks
 */
import { useCallback, useEffect, useState } from "react";
import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  EditorialSection,
  EditorialHeader,
} from "@/components/editorial";
import { TESTIMONIALS, type Testimonial } from "@/data/testimonials";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<Testimonial["kind"], string> = {
  patristic: "Voz da Tradição",
  reader: "Voz da comunidade",
};

interface Props {
  items?: Testimonial[];
  id?: string;
}

const TestimonialsSection = ({
  items = TESTIMONIALS,
  id = "depoimentos",
}: Props) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const goTo = useCallback(
    (idx: number) => {
      api?.scrollTo(idx);
    },
    [api],
  );

  if (count === 0) return null;

  const carouselId = `${id}-carousel`;

  return (
    <EditorialSection id={id} aria-labelledby="testimonials-heading">
      <div className="space-y-3 mb-8">
        <EditorialHeader
          kicker="Testimonia · Vozes"
          title={<span id="testimonials-heading">Vozes que caminham conosco</span>}
        />
        <p className="max-w-2xl text-base text-muted-foreground">
          Padres da Igreja e leitores contemporâneos — a mesma Tradição, através dos séculos.
        </p>
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false }}
        className="relative"
        aria-roledescription="carrossel"
        aria-label="Depoimentos"
        id={carouselId}
      >
        <CarouselContent className="-ml-4">
          {items.map((t, idx) => (
            <CarouselItem
              key={t.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} de ${count}`}
              className="pl-4 md:basis-1/2 lg:basis-1/2"
            >
              <TestimonialCard testimonial={t} />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="mt-6 flex items-center justify-between gap-4">
          {/* Indicadores (dots) */}
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Selecionar depoimento"
          >
            {items.map((t, idx) => {
              const active = idx === current;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-current={active ? "true" : undefined}
                  aria-controls={carouselId}
                  aria-label={`Ir para depoimento ${idx + 1} de ${count}`}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "min-h-11 min-w-11 flex items-center justify-center rounded-full",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  <span
                    className={cn(
                      "block h-2 rounded-full transition-all",
                      active
                        ? "w-6 bg-secondary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <CarouselPrevious
              aria-label="Depoimento anterior"
              aria-controls={carouselId}
              className="static translate-y-0"
            />
            <CarouselNext
              aria-label="Próximo depoimento"
              aria-controls={carouselId}
              className="static translate-y-0"
            />
          </div>
        </div>

        {/* live region para leitores de tela */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Depoimento {current + 1} de {count}
        </div>
      </Carousel>
    </EditorialSection>
  );
};

/* --------------------------------------------------------------------- */

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const isPatristic = testimonial.kind === "patristic";
  return (
    <figure
      className={cn(
        "h-full rounded-3xl border p-8 md:p-10 flex flex-col gap-6",
        isPatristic
          ? "border-secondary/40 bg-primary/[0.03]"
          : "border-border/40 bg-background",
      )}
    >
      <div className="flex items-center gap-3 text-secondary">
        <Quote className="h-5 w-5" aria-hidden="true" />
        <span className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em]">
          {KIND_LABEL[testimonial.kind]}
        </span>
      </div>

      <blockquote className="flex-1">
        <p className="font-serif italic text-xl md:text-2xl text-primary leading-relaxed">
          “{testimonial.quote}”
        </p>
      </blockquote>

      <figcaption className="border-t border-border/40 pt-4">
        <cite className="not-italic">
          <span className="block font-serif text-base text-primary">
            {testimonial.author}
          </span>
          <span className="block text-sm text-muted-foreground">
            {testimonial.source}
            {testimonial.period ? ` · ${testimonial.period}` : ""}
          </span>
        </cite>
      </figcaption>
    </figure>
  );
};

export default TestimonialsSection;
