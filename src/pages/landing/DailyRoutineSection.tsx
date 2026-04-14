import { motion } from "framer-motion";
import { Sun, Coffee, Moon, CheckCircle2 } from "lucide-react";
import { fadeUp } from "./animations";

const DailyRoutineSection = () => {
  const dayFlow = [
    {
      time: "Manhã",
      title: "Despertar com a Liturgia",
      icon: <Sun className="w-6 h-6 text-orange-400" />,
      desc: "Comece seu dia com as leituras da Santa Missa e o Santo do Dia. Consagre suas primeiras horas ao Senhor.",
      items: ["Liturgia Diária", "Santo do Dia", "Oferecimento da Manhã"]
    },
    {
      time: "Tarde",
      title: "Nutrição do Intelecto",
      icon: <Coffee className="w-6 h-6 text-brown-400" />,
      desc: "Aproveite pequenos intervalos para mergulhar no Catecismo ou tirar dúvidas teológicas com o Logos IA.",
      items: ["Parágrafo do CIC", "Consulta ao Logos IA", "Anotações de Estudo"]
    },
    {
      time: "Noite",
      title: "Repouso na Graça",
      icon: <Moon className="h-6 w-6 text-indigo-400" />,
      desc: "Finalize a jornada com o exame de consciência e o diário espiritual. Transforme seu dia em uma oferta de amor.",
      items: ["Exame de Consciência", "Diário Espiritual", "Oração de Completas"]
    }
  ];

  return (
    <section className="w-full py-24 px-6 bg-muted/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.span
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 block"
          >
            Sua Jornada Diária
          </motion.span>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-4xl md:text-5xl font-display font-bold"
          >
            O Cathedra em sua <span className="text-primary italic font-serif">Vida Comum</span>
          </motion.h2>
          <p className="text-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">
            "Quer comais, quer bebais ou façais qualquer outra coisa, fazei tudo para a glória de Deus." (1Cor 10,31)
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />

          {dayFlow.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i + 2}
              className="relative space-y-8 p-10 rounded-[3rem] bg-card border border-border/50 shadow-sm hover:shadow-2xl transition-all duration-500 group"
            >
              <div className="flex justify-between items-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-500">
                  {step.icon}
                </div>
                <span className="text-2xl font-display font-black text-primary/20 group-hover:text-primary/40 transition-colors">
                  {step.time}
                </span>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-serif">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <ul className="space-y-3 pt-4">
                {step.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-xs font-medium text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DailyRoutineSection;
