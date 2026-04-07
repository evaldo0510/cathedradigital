import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Library, Star, Zap, Clock, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppRoute } from "@/types";

const features = [
  { title: "Bíblia Sagrada", description: "Acesso completo às Escrituras com ferramentas de estudo, anotações e busca avançada.", benefit: "Fortaleça seu conhecimento bíblico e guarde suas passagens favoritas.", icon: <BookOpen className="h-7 w-7" />, route: AppRoute.BIBLE },
  { title: "Catechismus", description: "O Catecismo da Igreja Católica organizado por parágrafos para consulta rápida e segura.", benefit: "Tenha a doutrina sempre à mão para tirar dúvidas e aprofundar a fé.", icon: <Library className="h-7 w-7" />, route: AppRoute.CATECHISM },
  { title: "Vidas dos Santos", description: "Histórias inspiradoras e ensinamentos dos grandes santos da tradição católica.", benefit: "Encontre exemplos práticos de santidade para o seu dia a dia.", icon: <Star className="h-7 w-7" />, route: AppRoute.SAINTS },
  { title: "Colloquium IA", description: "Inteligência Artificial treinada no Magistério para auxiliar seus estudos teológicos.", benefit: "Respostas rápidas baseadas na sã doutrina para suas pesquisas complexas.", icon: <Zap className="h-7 w-7" />, route: AppRoute.STUDY_MODE, premium: true },
  { title: "Liturgia Diária", description: "Acompanhe as leituras da Santa Missa, o santo do dia e meditações diárias.", benefit: "Viva o tempo litúrgico em comunhão com toda a Igreja no mundo.", icon: <Clock className="h-7 w-7" />, route: AppRoute.DAILY_LITURGY },
  { title: "Comunidade", description: "Conecte-se com outros fiéis, compartilhe orações e participe de grupos de estudo.", benefit: "Nunca caminhe sozinho; encontre apoio e partilha na sua jornada cristã.", icon: <Users className="h-7 w-7" />, route: AppRoute.COMMUNITY },
];

interface FeaturesSectionProps {
  onNavigate: (route: string) => void;
}

const FeatureCard = ({ feature, index, onNavigate }: { feature: typeof features[0]; index: number; onNavigate: (r: string) => void }) => {
  // Alternate cards slide from left/right
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -60 : 60, rotateY: isLeft ? 8 : -8 }}
      whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card
          className="group h-full border-none bg-card shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col cursor-pointer relative"
          onClick={() => onNavigate(feature.route)}
        >
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-primary/5 transition-all duration-700 rounded-[2.5rem]" />

          <CardHeader className="space-y-4 relative z-10">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.15 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500 relative"
            >
              {feature.icon}
              {/* Pulse ring on hover */}
              <div className="absolute inset-0 rounded-3xl border-2 border-primary/0 group-hover:border-primary/30 group-hover:scale-125 transition-all duration-700 opacity-0 group-hover:opacity-100" />
            </motion.div>
            <CardTitle className="text-2xl font-serif flex items-center justify-between">
              {feature.title}
              {feature.premium && (
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-widest font-black"
                >
                  Premium
                </motion.span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col relative z-10">
            <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            <div className="p-4 bg-muted/30 rounded-2xl border border-primary/5 italic text-sm text-primary/80">
              <strong>Ganho:</strong> {feature.benefit}
            </div>
            <Button variant="ghost" className="w-full mt-auto justify-between group/btn text-xs font-black uppercase tracking-[0.2em]">
              Acessar Agora
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const FeaturesSection = ({ onNavigate }: FeaturesSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const decorY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={sectionRef} className="w-full max-w-7xl px-6 py-24 space-y-20 relative overflow-hidden">
      {/* Parallax decorative blurs */}
      <motion.div style={{ y: decorY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent/5 blur-[80px]" />
      </motion.div>

      {/* Section header with reveal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="text-center space-y-6 max-w-3xl mx-auto relative z-10"
      >
        <motion.span
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 block"
        >
          Recursos
        </motion.span>
        <h2 className="text-4xl md:text-6xl font-display font-bold">Ferramentas para sua Edificação</h2>
        <p className="text-lg text-muted-foreground italic">"Conhecereis a verdade, e a verdade vos libertará" (Jo 8,32)</p>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-24 h-1.5 bg-primary mx-auto rounded-full origin-center"
        />
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {features.map((feature, idx) => (
          <FeatureCard key={feature.title} feature={feature} index={idx} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
