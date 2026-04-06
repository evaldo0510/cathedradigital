import { motion } from "framer-motion";
import { BookOpen, Library, Star, Zap, Clock, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppRoute } from "@/types";
import { fadeUp, cardHover } from "./animations";

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

const FeaturesSection = ({ onNavigate }: FeaturesSectionProps) => (
  <section className="w-full max-w-7xl px-6 py-24 space-y-20">
    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-6 max-w-3xl mx-auto">
      <h2 className="text-4xl md:text-6xl font-display font-bold">Ferramentas para sua Edificação</h2>
      <p className="text-lg text-muted-foreground italic">"Conhecereis a verdade, e a verdade vos libertará" (Jo 8,32)</p>
      <div className="w-24 h-1.5 bg-primary mx-auto rounded-full" />
    </motion.div>

    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, idx) => (
        <motion.div key={feature.title} variants={cardHover} initial="rest" whileHover="hover" whileTap="tap">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={idx}>
            <Card className="group h-full border-none bg-card shadow-xl hover:shadow-2xl transition-shadow duration-500 rounded-[2.5rem] overflow-hidden flex flex-col cursor-pointer" onClick={() => onNavigate(feature.route)}>
              <CardHeader className="space-y-4">
                <motion.div whileHover={{ rotate: 12, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                  {feature.icon}
                </motion.div>
                <CardTitle className="text-2xl font-serif flex items-center justify-between">
                  {feature.title}
                  {feature.premium && <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-widest font-black">Premium</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                <div className="p-4 bg-muted/30 rounded-2xl border border-primary/5 italic text-sm text-primary/80">
                  <strong>Ganho:</strong> {feature.benefit}
                </div>
                <Button variant="ghost" className="w-full mt-auto justify-between group/btn text-xs font-black uppercase tracking-[0.2em]">
                  Acessar Agora <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default FeaturesSection;
