import React, { useState } from 'react';
import { Icons } from '../../constants';

interface MissalSection {
  id: string;
  title: string;
  latin?: string;
  parts: { label: string; latin?: string; text: string }[];
}

const MISSAL_SECTIONS: MissalSection[] = [
  {
    id: 'entrance', title: 'Ritos Iniciais',
    parts: [
      { label: 'Sinal da Cruz', latin: 'In nómine Patris, et Fílii, et Spíritus Sancti.', text: 'Em nome do Pai, e do Filho, e do Espírito Santo. Amém.' },
      { label: 'Saudação', latin: 'Dóminus vobíscum. — Et cum spíritu tuo.', text: 'O Senhor esteja convosco. — Ele está no meio de nós.' },
      { label: 'Ato Penitencial (Confiteor)', latin: 'Confíteor Deo omnipoténti et vobis, fratres, quia peccávi nimis cogitatióne, verbo, ópere et omissióne...', text: 'Confesso a Deus todo-poderoso e a vós, irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões, por minha culpa, minha tão grande culpa. E peço à Virgem Maria, aos Anjos e Santos, e a vós, irmãos e irmãs, que rogueis por mim a Deus, nosso Senhor.' },
      { label: 'Kyrie', latin: 'Kýrie, eléison. Christe, eléison. Kýrie, eléison.', text: 'Senhor, tende piedade de nós. Cristo, tende piedade de nós. Senhor, tende piedade de nós.' },
      { label: 'Glória', latin: 'Glória in excélsis Deo. Et in terra pax homínibus bonæ voluntátis...', text: 'Glória a Deus nas alturas, e paz na terra aos homens por Ele amados. Senhor Deus, Rei dos céus, Deus Pai todo-poderoso: nós Vos louvamos, nós Vos bendizemos, nós Vos adoramos, nós Vos glorificamos, nós Vos damos graças por Vossa imensa glória. Senhor Jesus Cristo, Filho Unigênito, Senhor Deus, Cordeiro de Deus, Filho de Deus Pai: Vós que tirais o pecado do mundo, tende piedade de nós; Vós que tirais o pecado do mundo, acolhei a nossa súplica; Vós que estais à direita do Pai, tende piedade de nós. Só Vós sois o Santo, só Vós, o Senhor, só Vós, o Altíssimo, Jesus Cristo, com o Espírito Santo, na glória de Deus Pai. Amém.' },
    ]
  },
  {
    id: 'liturgy-word', title: 'Liturgia da Palavra',
    parts: [
      { label: 'Primeira Leitura', text: 'Leitura do Antigo Testamento (ou Atos dos Apóstolos no Tempo Pascal). Ao final: "Palavra do Senhor." — "Graças a Deus."' },
      { label: 'Salmo Responsorial', text: 'Salmo cantado ou recitado com resposta da assembleia.' },
      { label: 'Segunda Leitura', text: 'Leitura das Epístolas. Ao final: "Palavra do Senhor." — "Graças a Deus."' },
      { label: 'Aclamação ao Evangelho', latin: 'Allelúia!', text: 'Aleluia, Aleluia! (Na Quaresma usa-se outra aclamação.) Ao anúncio do Evangelho: "O Senhor esteja convosco." — "Ele está no meio de nós." "Proclamação do Evangelho de Jesus Cristo segundo N." — "Glória a vós, Senhor!" Ao final: "Palavra da Salvação." — "Glória a vós, Senhor!"' },
      { label: 'Homilia', text: 'O sacerdote ou diácono explica as leituras e aplica ao cotidiano dos fiéis.' },
      { label: 'Profissão de Fé (Credo)', latin: 'Credo in unum Deum, Patrem omnipoténtem, factórem cæli et terræ, visibílium ómnium et invisibílium...', text: 'Creio em um só Deus, Pai todo-poderoso, Criador do céu e da terra, de todas as coisas visíveis e invisíveis. Creio em um só Senhor, Jesus Cristo, Filho Unigênito de Deus, nascido do Pai antes de todos os séculos: Deus de Deus, Luz da Luz, Deus verdadeiro de Deus verdadeiro; gerado, não criado, consubstancial ao Pai. Por Ele todas as coisas foram feitas. E por nós, homens, e para nossa salvação, desceu dos céus; e Se encarnou pelo Espírito Santo, no seio da Virgem Maria, e Se fez homem. Também por nós foi crucificado sob Pôncio Pilatos; padeceu e foi sepultado. Ressuscitou ao terceiro dia, conforme as Escrituras, e subiu aos céus, onde está sentado à direita do Pai. E de novo há de vir, em sua glória, para julgar os vivos e os mortos; e o Seu Reino não terá fim. Creio no Espírito Santo, Senhor que dá a vida, e procede do Pai e do Filho; e com o Pai e o Filho é adorado e glorificado: Ele que falou pelos Profetas. Creio na Igreja Una, Santa, Católica e Apostólica. Professo um só Batismo para a remissão dos pecados. E espero a ressurreição dos mortos e a vida do mundo que há de vir. Amém.' },
      { label: 'Oração dos Fiéis', text: 'Preces da assembleia. Resposta comum: "Senhor, escutai a nossa prece."' },
    ]
  },
  {
    id: 'liturgy-eucharist', title: 'Liturgia Eucarística',
    parts: [
      { label: 'Apresentação das Oferendas', latin: 'Benedíctus es, Dómine, Deus univérsi...', text: 'Bendito sejais, Senhor, Deus do universo, pelo pão que recebemos de Vossa bondade, fruto da terra e do trabalho do homem, que agora Vos apresentamos e para nós se vai tornar pão da vida. — Bendito seja Deus para sempre!' },
      { label: 'Oração sobre as Oferendas', text: 'O sacerdote reza a oração própria do dia sobre os dons apresentados.' },
      { label: 'Prefácio e Santo', latin: 'Sanctus, Sanctus, Sanctus Dóminus Deus Sábaoth. Pleni sunt cæli et terra glória tua. Hosánna in excélsis. Benedíctus qui venit in nómine Dómini. Hosánna in excélsis.', text: 'Santo, Santo, Santo, Senhor, Deus do Universo! O céu e a terra proclamam a Vossa glória! Hosana nas alturas! Bendito o que vem em nome do Senhor! Hosana nas alturas!' },
      { label: 'Oração Eucarística — Consagração', latin: 'Hoc est enim Corpus meum... Hic est enim calix Sánguinis mei...', text: '"TOMAI, TODOS, E COMEI: ISTO É O MEU CORPO, QUE SERÁ ENTREGUE POR VÓS."\n\n"TOMAI, TODOS, E BEBEI: ESTE É O CÁLICE DO MEU SANGUE, O SANGUE DA NOVA E ETERNA ALIANÇA, QUE SERÁ DERRAMADO POR VÓS E POR MUITOS, PARA REMISSÃO DOS PECADOS. FAZEI ISTO EM MEMÓRIA DE MIM."\n\nEis o mistério da fé! — Anunciamos, Senhor, a Vossa morte, proclamamos a Vossa ressurreição. Vinde, Senhor Jesus!' },
      { label: 'Pai Nosso', latin: 'Pater noster, qui es in cælis: sanctificétur nomen tuum; advéniat regnum tuum; fiat volúntas tua, sicut in cælo, et in terra...', text: 'Pai nosso que estais nos céus, santificado seja o Vosso nome, venha a nós o Vosso Reino, seja feita a Vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do mal.' },
      { label: 'Cordeiro de Deus', latin: 'Agnus Dei, qui tollis peccáta mundi: miserére nobis. Agnus Dei, qui tollis peccáta mundi: dona nobis pacem.', text: 'Cordeiro de Deus, que tirais o pecado do mundo, tende piedade de nós. Cordeiro de Deus, que tirais o pecado do mundo, tende piedade de nós. Cordeiro de Deus, que tirais o pecado do mundo, dai-nos a paz.' },
      { label: 'Comunhão', text: '"Senhor, eu não sou digno(a) de que entreis em minha morada, mas dizei uma palavra e serei salvo(a)." Os fiéis recebem o Corpo e o Sangue de Cristo.' },
    ]
  },
  {
    id: 'final', title: 'Ritos Finais',
    parts: [
      { label: 'Bênção Final', latin: 'Benedícat vos omnípotens Deus, Pater, et Fílius, et Spíritus Sanctus.', text: 'Abençoe-vos Deus todo-poderoso, Pai, Filho e Espírito Santo. — Amém.' },
      { label: 'Despedida', latin: 'Ite, missa est. — Deo grátias.', text: 'Ide em paz e o Senhor vos acompanhe. — Graças a Deus.' },
    ]
  },
];

const MissalPage: React.FC = () => {
  const [showLatin, setShowLatin] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('entrance');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Cross className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Ordo Missæ</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Missal Romano</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">O Ordinário da Santa Missa — rito romano.</p>
      </div>

      <div className="flex justify-center">
        <button onClick={() => setShowLatin(!showLatin)}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${showLatin ? 'bg-foreground text-background' : 'bg-card border border-border text-foreground'}`}>
          {showLatin ? '🔤 Latim ativado' : '🔤 Mostrar Latim'}
        </button>
      </div>

      <div className="space-y-4">
        {MISSAL_SECTIONS.map(section => (
          <div key={section.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-primary/5 transition-all"
            >
              <h3 className="text-lg font-serif font-bold text-foreground">{section.title}</h3>
              <Icons.ArrowDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`} />
            </button>

            {expandedSection === section.id && (
              <div className="border-t border-border divide-y divide-border">
                {section.parts.map((part, i) => (
                  <div key={i} className="p-5 space-y-3">
                    <h4 className="text-sm font-black uppercase tracking-widest text-primary">{part.label}</h4>
                    {showLatin && part.latin && (
                      <p className="text-sm text-muted-foreground font-serif italic bg-muted rounded-xl p-4">{part.latin}</p>
                    )}
                    <p className="text-sm text-foreground/90 font-serif leading-relaxed whitespace-pre-line">{part.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissalPage;
