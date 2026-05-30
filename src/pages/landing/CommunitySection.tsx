import { motion } from "framer-motion";
import { Users, Globe, Shield, MessageSquare } from "lucide-react";
import { fadeUp } from "./animations";

const CommunitySection = () => {
  const communityFeatures = [
    {
      title: "Rede de Oração Viva",
      desc: "Milhares de fiéis unidos em oração simultânea. Peça orações e interceda pelos seus irmãos em Cristo.",
      icon: <Users className="w-6 h-6" />,
      tag: "Intercessão"
    },
    {
      title: "Irmandades Digitais",
      desc: "Grupos de estudo e partilha focados em temas específicos do Magistério e da vida dos santos.",
      icon: <Globe className="h-6 w-6" />,
      tag: "Comunidade"
    },
    {
      title: "Ambiente Seguro",
      desc: "Espaço moderado e livre de distrações, focado exclusivamente no crescimento espiritual e teológico.",
      icon: <Shield className="h-6 w-6" />,
      tag: "Privacidade"
    },
    {
      title: "Partilha de Graças",
      desc: "Um mural para testemunhar as maravilhas que Deus opera em sua vida através do estudo e da oração.",
      icon: <MessageSquare className="h-6 w-6" />,
      tag: "Testemunho"
    }
  ];

  return (
    <section className="w-full py-4xl px-md bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3xl h-3xl bg-primary/[0.02] rounded-premium pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-3xl relative z-10">
        <div className="text-center space-y-md max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="inline-flex items-center gap-xs px-md py-xs bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-[10px] font-semibold uppercase tracking-premium-wide"
          >
            <span>Irmandade Cathedra</span>
          </motion.div>
          
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="font-display font-bold leading-tight"
          >
            Você nunca está <span className="text-primary italic font-serif">sozinho</span> em sua jornada
          </motion.h2>
          
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="text-muted-foreground font-serif italic"
          >
            "Onde dois ou três estão reunidos em meu nome, ali estou eu no meio deles." (Mt 18,20)
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {communityFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i + 3}
              whileHover={{ y: -10 }}
              className="p-xl rounded-xl bg-card border border-border/50 shadow-md hover:shadow-premium-hover hover:border-primary/20 transition-all duration-500 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-premium bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <span className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 bg-muted px-2 py-1 rounded-full">
                  {feature.tag}
                </span>
              </div>
              <h3 className="font-bold mb-4 font-serif">{feature.title}</h3>
              <p className="text-premium-small text-muted-foreground leading-relaxed flex-1">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="p-10 rounded-[3rem] bg-muted border border-border/50 text-center space-y-6"
        >
          <div className="flex -space-x-4 justify-center mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-12 h-12 rounded-premium border-4 border-background bg-muted overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} 
                  alt="Avatar de membro"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <div className="w-12 h-12 rounded-premium border-4 border-background bg-primary flex items-center justify-center text-white text-premium-tiny font-bold">
              +1k
            </div>
          </div>
          <h4 className="font-bold">Junte-se a milhares de fiéis</h4>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Mais do que um aplicativo, somos uma família em busca da santidade. Participe das nossas vigílias mensais e grupos de estudo.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunitySection;
