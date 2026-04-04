// Update this page (the content is just a fallback if you fail to update the page)

import { Youtube, Heart, Music, Clock, Handshake, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-primary">
          Bem-vindo ao Espaço Devocional
        </h1>
        <p className="mb-10 text-xl text-muted-foreground">
          Um lugar para oração, música e reflexão.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/20 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Music className="h-8 w-8" />
                </div>
              </div>
              <CardTitle>Frei Gilson / Som do Monte</CardTitle>
              <CardDescription>Vida de Oração e Música</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">
                Frei Gilson é um frade carmelita conhecido por levar a mensagem do Evangelho através da música e de momentos profundos de oração, como o Rosário da Madrugada.
              </p>
              <div className="space-y-3">
                <Button className="w-full gap-2" variant="default" asChild>
                  <a href="https://www.youtube.com/@FreiGilsonSomdoMonte" target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-4 w-4" /> YouTube Oficial
                  </a>
                </Button>
                <div className="flex items-center justify-center gap-4 text-xs font-medium text-primary">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Rosário: 4:00 AM
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> Evangelização
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center justify-center border-dashed border-2 border-muted-foreground/20 bg-transparent p-6">
            <p className="text-center italic text-muted-foreground">
              "A oração é a chave que abre o coração de Deus."
            </p>
          </Card>
        </div>
        
        <div className="mt-12 w-full max-w-2xl">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Handshake className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-2xl">Novas Parcerias</CardTitle>
              <CardDescription>Novidades estão por vir!</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Ainda não podemos revelar todos os detalhes, mas estamos preparando algo muito especial para você.
              </p>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white transition-colors" disabled>
                Em Breve
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
