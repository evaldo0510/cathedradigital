import { motion } from "framer-motion";
import { Sun, Coffee, Moon, CheckCircle2 } from "lucide-react";
import { HomeCard } from "@/components/cathedra/HomeCard";

const DailyRoutineSection = () => {
  const dayFlow = [
    {
      time: "Manhã",
      title: "Despertar com a Liturgia",
      icon: <Sun className="w-6 h-6 text-primary" />,
      desc: "Comece seu dia com as leituras da Santa Missa e o Santo do Dia. Consagre suas primeiras horas ao Senhor.",
      items: ["Liturgia Diária", "Santo do Dia", "Oferecimento da Manhã"]
    },
    {
      time: "Tarde",
      title: "Nutrição do Intelecto",
      icon: <Coffee className="w-6 h-6 text-primary" />,
      desc: "Aproveite pequenos intervalos para mergulhar no Catecismo ou tirar dúvidas teológicas com o Logos IA.",
      items: ["Parágrafo do CIC", "Consulta ao Logos IA", "Anotações de Estudo"]
    },
    {
      time: "Noite",
      title: "Repouso na Graça",
      icon: <Moon className="h-6 w-6 text-primary" />,
      desc: "Finalize a jornada com o exame de consciência e o diário espiritual. Transforme seu dia em uma oferta de amor.",
      items: ["Exame de Consciência", "Diário Espiritual", "Oração de Completas"]
    }
  ];

  return (
    <section className="w-full section-spacing relative overflow-hidden bg-primary/[0.01]">
      <div className="app-container space-y-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60 italic">O Ritmo</span>
          <h2 className="font-display font-bold">Vivência Cotidiana</h2>
          <p className="text-muted-foreground font-serif text-lg md:text-xl mx-auto">Fazei tudo para a glória de Deus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {dayFlow.map((step) => (
            <HomeCard
              key={step.title}
              className="p-8 flex flex-col space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
                <span className="text-xs font-display font-bold text-primary/50 uppercase tracking-widest">
                  {step.time}
                </span>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold font-serif">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <ul className="space-y-3 pt-6 border-t border-border/10 mt-auto">
                {step.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-xs font-medium text-foreground/70">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DailyRoutineSection;
