import { motion } from "framer-motion";
import { Sun, Coffee, Moon, CheckCircle2 } from "lucide-react";
import { CathedraCard } from "@/components/cathedra/CathedraCard";

const DailyRoutineSection = () => {
  const dayFlow = [
    {
      time: "Manhã",
      title: "Despertar com a Liturgia",
      icon: <Sun className="w-spacing-lg h-spacing-lg text-primary" />,
      desc: "Comece seu dia com as leituras da Santa Missa e o Santo do Dia. Consagre suas primeiras horas ao Senhor.",
      items: ["Liturgia Diária", "Santo do Dia", "Oferecimento da Manhã"]
    },
    {
      time: "Tarde",
      title: "Nutrição do Intelecto",
      icon: <Coffee className="w-spacing-lg h-spacing-lg text-primary" />,
      desc: "Aproveite pequenos intervalos para mergulhar no Catecismo ou tirar dúvidas teológicas com o Logos IA.",
      items: ["Parágrafo do CIC", "Consulta ao Logos IA", "Anotações de Estudo"]
    },
    {
      time: "Noite",
      title: "Repouso na Graça",
      icon: <Moon className="h-spacing-lg w-spacing-lg text-primary" />,
      desc: "Finalize a jornada com o exame de consciência e o diário espiritual. Transforme seu dia em uma oferta de amor.",
      items: ["Exame de Consciência", "Diário Espiritual", "Oração de Completas"]
    }
  ];

  return (
    <section className="w-full section-spacing relative overflow-hidden bg-primary/[0.01]">
      <div className="app-container space-y-spacing-3xl">
        <div className="text-center space-y-spacing-lg max-w-spacing-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.4em] text-primary/60 italic">O Ritmo</span>
          <h2 className="font-display font-bold text-foreground">Vivência Cotidiana</h2>
          <p className="text-muted-foreground/90 font-serif text-lg md:text-xl mx-auto">Fazei tudo para a glória de Deus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-xl md:gap-spacing-xl">
          {dayFlow.map((step) => (
            <CathedraCard
              key={step.title}
              className="p-spacing-xl flex flex-col space-y-spacing-xl"
            >
              <div className="flex justify-between items-center">
                <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
                <span className="text-xs font-display font-bold text-primary/50 uppercase tracking-widest">
                  {step.time}
                </span>
              </div>
              
              <div className="space-y-spacing-sm">
                <h3 className="font-bold font-serif">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <ul className="space-y-spacing-sm pt-spacing-lg border-t border-border/10 mt-auto">
                {step.items.map((item) => (
                  <li key={item} className="flex items-center gap-spacing-sm text-xs font-medium text-foreground/70">
                    <CheckCircle2 className="w-spacing-md h-spacing-md text-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CathedraCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DailyRoutineSection;
