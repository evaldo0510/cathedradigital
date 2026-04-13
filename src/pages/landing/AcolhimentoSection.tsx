import { motion } from "framer-motion";
import { Heart, Coffee, Home, Users } from "lucide-react";
import { fadeUp } from "./animations";

const AcolhimentoSection = () => {
  return (
    <section className="w-full py-24 px-6 bg-primary/5">
      <div className="max-w-7xl mx-auto space-y-16">
        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary border border-primary/20">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sinta-se em Casa</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold">Um Espaço Feito por Fiéis para Fiéis</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif italic">
            "Não sois mais estrangeiros, nem hóspedes, mas sois concidadãos dos santos e membros da família de Deus." (Efésios 2,19)
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              title: "Ambiente Familiar", 
              icon: <Home className="w-5 h-5" />, 
              desc: "Desenvolvemos cada detalhe para que sua experiência de oração e estudo seja tranquila e sem distrações. Aqui, o foco é o seu encontro com Deus." 
            },
            { 
              title: "Acolhimento e Suporte", 
              icon: <Coffee className="w-5 h-5" />, 
              desc: "Dúvidas sobre a fé ou sobre o app? Nossa equipe e comunidade estão prontas para caminhar com você. Não é apenas um app, é uma irmandade." 
            },
            { 
              title: "Construído Juntos", 
              icon: <Users className="w-5 h-5" />, 
              desc: "O Cathedra cresce com o seu feedback. Cada sugestão sua ajuda a tornar este santuário digital mais completo para todos os católicos." 
            }
          ].map((item, i) => (
            <motion.div 
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i + 1}
              whileHover={{ y: -5, scale: 1.02 }}
              className="space-y-4 p-8 bg-card rounded-[2.5rem] border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold font-serif">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AcolhimentoSection;
