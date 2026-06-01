import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Icons } from '../../constants';


interface MissalSection {
  id: string;
  title: string;
  subtitle?: string;
  parts: { label: string; latin?: string; text: string; rubric?: string }[];
}

const MISSAL_SECTIONS: MissalSection[] = [
  {
    id: 'entrance', title: 'Ritos Iniciais', subtitle: 'Ritus Initiales',
    parts: [
      { label: 'Sinal da Cruz', latin: 'In nómine Patris, et Fílii, et Spíritus Sancti. Amen.', text: 'Em nome do Pai, e do Filho, e do Espírito Santo. Amém.', rubric: 'O sacerdote faz o sinal da cruz juntamente com a assembleia.' },
      { label: 'Saudação', latin: 'Dóminus vobíscum.\n— Et cum spíritu tuo.', text: 'O Senhor esteja convosco.\n— Ele está no meio de nós.\n\nOu: A graça de nosso Senhor Jesus Cristo, o amor do Pai e a comunhão do Espírito Santo estejam convosco.\n— Bendito seja Deus, que nos reuniu no amor de Cristo.' },
      { label: 'Ato Penitencial — Forma I (Confiteor)', latin: 'Confíteor Deo omnipoténti et vobis, fratres, quia peccávi nimis cogitatióne, verbo, ópere et omissióne: mea culpa, mea culpa, mea máxima culpa. Ideo precor beátam Maríam semper Vírginem, omnes Angelos et Sanctos, et vos, fratres, oráre pro me ad Dóminum Deum nostrum.', text: 'Confesso a Deus todo-poderoso e a vós, irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões, por minha culpa, minha tão grande culpa. E peço à Virgem Maria, aos Anjos e Santos, e a vós, irmãos e irmãs, que rogueis por mim a Deus, nosso Senhor.', rubric: 'Bate-se no peito ao dizer "por minha culpa".' },
      { label: 'Ato Penitencial — Forma II', text: 'Sacerdote: Tende compaixão de nós, Senhor.\nAssembleia: Porque somos pecadores.\nSacerdote: Mostrai-nos, Senhor, a vossa misericórdia.\nAssembleia: E dai-nos a vossa salvação.' },
      { label: 'Ato Penitencial — Forma III', text: 'Senhor, que viestes salvar os contritos de coração: Senhor, tende piedade de nós. — Senhor, tende piedade de nós.\nCristo, que viestes chamar os pecadores: Cristo, tende piedade de nós. — Cristo, tende piedade de nós.\nSenhor, que intercedeis por nós junto do Pai: Senhor, tende piedade de nós. — Senhor, tende piedade de nós.' },
      { label: 'Kyrie', latin: 'Kýrie, eléison. — Kýrie, eléison.\nChriste, eléison. — Christe, eléison.\nKýrie, eléison. — Kýrie, eléison.', text: 'Senhor, tende piedade de nós. — Senhor, tende piedade de nós.\nCristo, tende piedade de nós. — Cristo, tende piedade de nós.\nSenhor, tende piedade de nós. — Senhor, tende piedade de nós.' },
      { label: 'Glória', latin: 'Glória in excélsis Deo.\nEt in terra pax homínibus bonæ voluntátis.\nLaudámus te, benedícimus te,\nadórámus te, glorificámus te,\ngrátias ágimus tibi propter magnam glóriam tuam,\nDómine Deus, Rex cæléstis,\nDeus Pater omnípotens.\nDómine Fili Unigénite, Iesu Christe,\nDómine Deus, Agnus Dei, Fílius Patris,\nqui tollis peccáta mundi,\nmiserére nobis;\nqui tollis peccáta mundi,\nsúscipe deprecatiónem nostram.\nQui sedes ad déxteram Patris,\nmiserére nobis.\nQuóniam tu solus Sanctus,\ntu solus Dóminus,\ntu solus Altíssimus,\nIesu Christe,\ncum Sancto Spíritu:\nin glória Dei Patris. Amen.', text: 'Glória a Deus nas alturas,\ne paz na terra aos homens por Ele amados.\nSenhor Deus, Rei dos céus,\nDeus Pai todo-poderoso:\nnós Vos louvamos, nós Vos bendizemos,\nnós Vos adoramos, nós Vos glorificamos,\nnós Vos damos graças por Vossa imensa glória.\nSenhor Jesus Cristo, Filho Unigênito,\nSenhor Deus, Cordeiro de Deus, Filho de Deus Pai:\nVós que tirais o pecado do mundo, tende piedade de nós;\nVós que tirais o pecado do mundo, acolhei a nossa súplica;\nVós que estais à direita do Pai, tende piedade de nós.\nSó Vós sois o Santo, só Vós, o Senhor,\nsó Vós, o Altíssimo, Jesus Cristo,\ncom o Espírito Santo, na glória de Deus Pai. Amém.', rubric: 'Omitido na Quaresma e no Advento, exceto em solenidades e festas.' },
      { label: 'Oração Coleta', text: 'O sacerdote convida à oração: "Oremos." Após breve silêncio, reza a Oração Coleta própria do dia. A assembleia responde: "Amém."', rubric: 'A Oração Coleta varia conforme o dia litúrgico.' },
    ]
  },
  {
    id: 'liturgy-word', title: 'Liturgia da Palavra', subtitle: 'Liturgia Verbi',
    parts: [
      { label: 'Primeira Leitura', text: 'Leitura do Antigo Testamento (ou Atos dos Apóstolos no Tempo Pascal).\n\nAo final: "Palavra do Senhor." — "Graças a Deus."', rubric: 'Todos se sentam.' },
      { label: 'Salmo Responsorial', text: 'Salmo cantado ou recitado com resposta da assembleia.', rubric: 'Preferível que seja cantado. A resposta é repetida pela assembleia após cada estrofe.' },
      { label: 'Segunda Leitura', text: 'Leitura das Epístolas (Domingos e Solenidades).\n\nAo final: "Palavra do Senhor." — "Graças a Deus."', rubric: 'Presente aos domingos e solenidades.' },
      { label: 'Aclamação ao Evangelho', latin: 'Allelúia! (Na Quaresma: Laus tibi, Christe, Rex ætérnæ glóriæ)', text: 'Aleluia, Aleluia!\n(Na Quaresma usa-se outra aclamação: "Louvor a vós, ó Cristo, Rei da eterna glória!")', rubric: 'Todos se levantam. Omite-se se não for cantada.' },
      { label: 'Evangelho', text: '"O Senhor esteja convosco." — "Ele está no meio de nós."\n"Proclamação do Evangelho de Jesus Cristo segundo N." — "Glória a vós, Senhor!"\n\n(Leitura do Evangelho)\n\nAo final: "Palavra da Salvação." — "Glória a vós, Senhor!"', rubric: 'O diácono ou sacerdote proclama o Evangelho. Todos fazem o sinal da cruz na fronte, lábios e peito.' },
      { label: 'Homilia', text: 'O sacerdote ou diácono explica as leituras e aplica-as à vida dos fiéis.', rubric: 'Obrigatória nos domingos e festas de preceito. Recomendada nos dias feriais.' },
      { label: 'Profissão de Fé — Símbolo Niceno-Constantinopolitano', latin: 'Credo in unum Deum,\nPatrem omnipoténtem,\nfactórem cæli et terræ,\nvisibílium ómnium et invisibílium.\n\nEt in unum Dóminum Iesum Christum,\nFílium Dei Unigénitum,\net ex Patre natum ante ómnia sǽcula.\nDeum de Deo, lumen de lúmine,\nDeum verum de Deo vero,\ngénitum, non factum,\nconsubstantiálem Patri:\nper quem ómnia facta sunt.\nQui propter nos hómines\net propter nostram salútem\ndescéndit de cælis.\n\nEt incarnátus est de Spíritu Sancto\nex María Vírgine, et homo factus est.\n\nCrucifíxus étiam pro nobis sub Póntio Piláto;\npassus et sepúltus est,\net resurréxit tértia die,\nsecúndum Scriptúras,\net ascéndit in cælum,\nsedet ad déxteram Patris.\nEt íterum ventúrus est cum glória,\niudicáre vivos et mórtuos,\ncuius regni non erit finis.\n\nEt in Spíritum Sanctum,\nDóminum et vivificántem:\nqui ex Patre Filióque procédit.\nQui cum Patre et Fílio\nsimul adorátur et conglorificátur:\nqui locútus est per prophétas.\n\nEt unam, sanctam, cathólicam\net apostólicam Ecclésiam.\n\nConfíteor unum baptísma\nin remissiónem peccatórum.\n\nEt expécto resurrectiónem mortuórum,\net vitam ventúri sǽculi. Amen.', text: 'Creio em um só Deus, Pai todo-poderoso,\nCriador do céu e da terra,\nde todas as coisas visíveis e invisíveis.\n\nCreio em um só Senhor, Jesus Cristo,\nFilho Unigênito de Deus,\nnascido do Pai antes de todos os séculos:\nDeus de Deus, Luz da Luz,\nDeus verdadeiro de Deus verdadeiro;\ngerado, não criado,\nconsubstancial ao Pai.\nPor Ele todas as coisas foram feitas.\nE por nós, homens, e para nossa salvação,\ndesceu dos céus;\n\ne Se encarnou pelo Espírito Santo,\nno seio da Virgem Maria,\ne Se fez homem.\n\nTambém por nós foi crucificado sob Pôncio Pilatos;\npadeceu e foi sepultado.\nRessuscitou ao terceiro dia,\nconforme as Escrituras,\ne subiu aos céus,\nonde está sentado à direita do Pai.\nE de novo há de vir, em sua glória,\npara julgar os vivos e os mortos;\ne o Seu Reino não terá fim.\n\nCreio no Espírito Santo,\nSenhor que dá a vida,\ne procede do Pai e do Filho;\ne com o Pai e o Filho\né adorado e glorificado:\nEle que falou pelos Profetas.\n\nCreio na Igreja Una, Santa,\nCatólica e Apostólica.\n\nProfesso um só Batismo\npara a remissão dos pecados.\n\nE espero a ressurreição dos mortos\ne a vida do mundo que há de vir. Amém.', rubric: 'Faz-se genuflexão ao dizer "e Se encarnou... e Se fez homem". Nas solenidades da Anunciação e do Natal, todos se ajoelham.' },
      { label: 'Oração dos Fiéis (Preces)', text: 'O sacerdote introduz as preces. O diácono ou leitor proclama as intenções. A assembleia responde com a invocação própria, como:\n"Senhor, escutai a nossa prece."\nou "Ouvi-nos, Senhor."', rubric: 'As intenções seguem a ordem: Igreja, autoridades, necessitados, comunidade local.' },
    ]
  },
  {
    id: 'liturgy-eucharist', title: 'Liturgia Eucarística', subtitle: 'Liturgia Eucharistica',
    parts: [
      { label: 'Apresentação das Oferendas', latin: 'Benedíctus es, Dómine, Deus univérsi, quia de tua largitáte accépimus panem, quem tibi offérimus, fructum terræ et óperis mánuum hóminum: ex quo nobis fiet panis vitæ.\n— Benedíctus Deus in sǽcula.', text: 'Bendito sejais, Senhor, Deus do universo, pelo pão que recebemos de Vossa bondade, fruto da terra e do trabalho do homem, que agora Vos apresentamos e para nós se vai tornar pão da vida.\n— Bendito seja Deus para sempre!\n\nBendito sejais, Senhor, Deus do universo, pelo vinho que recebemos de Vossa bondade, fruto da videira e do trabalho do homem, que agora Vos apresentamos e para nós se vai tornar vinho da salvação.\n— Bendito seja Deus para sempre!', rubric: 'Pode ser feita a coleta e o canto do ofertório.' },
      { label: 'Lavabo', latin: 'Lava me, Dómine, ab iniquitáte mea, et a peccáto meo munda me.', text: 'Lavai-me, Senhor, das minhas faltas e purificai-me do meu pecado.', rubric: 'O sacerdote lava as mãos em silêncio ou rezando esta oração.' },
      { label: 'Orai, irmãos', text: 'Orai, irmãos e irmãs, para que o nosso sacrifício seja aceito por Deus Pai todo-poderoso.\n— Receba o Senhor por tuas mãos este sacrifício, para glória do seu nome, para nosso bem e de toda a sua santa Igreja.' },
      { label: 'Oração sobre as Oferendas', text: 'O sacerdote reza a oração própria do dia sobre os dons apresentados. A assembleia responde: "Amém."', rubric: 'Varia conforme o dia litúrgico.' },
      { label: 'Prefácio', text: '"O Senhor esteja convosco." — "Ele está no meio de nós."\n"Corações ao alto." — "O nosso coração está em Deus."\n"Demos graças ao Senhor, nosso Deus." — "É nosso dever e nossa salvação."', rubric: 'Segue-se o Prefácio próprio do tempo ou da celebração.' },
      { label: 'Santo (Sanctus)', latin: 'Sanctus, Sanctus, Sanctus\nDóminus Deus Sábaoth.\nPleni sunt cæli et terra glória tua.\nHosánna in excélsis.\nBenedíctus qui venit in nómine Dómini.\nHosánna in excélsis.', text: 'Santo, Santo, Santo,\nSenhor, Deus do Universo!\nO céu e a terra proclamam a Vossa glória!\nHosana nas alturas!\nBendito o que vem em nome do Senhor!\nHosana nas alturas!' },
      { label: 'Oração Eucarística — Consagração', latin: 'HOC EST ENIM CORPUS MEUM,\nQUOD PRO VOBIS TRADÉTUR.\n\nHIC EST ENIM CALIX SÁNGUINIS MEI\nNOVI ET ÆTÉRNI TESTAMÉNTI,\nQUI PRO VOBIS ET PRO MULTIS EFFUNDÉTUR\nIN REMISSIÓNEM PECCATÓRUM.\nHOC FÁCITE IN MEAM COMMEMORATIÓNEM.', text: '"TOMAI, TODOS, E COMEI:\nISTO É O MEU CORPO,\nQUE SERÁ ENTREGUE POR VÓS."\n\n"TOMAI, TODOS, E BEBEI:\nESTE É O CÁLICE DO MEU SANGUE,\nO SANGUE DA NOVA E ETERNA ALIANÇA,\nQUE SERÁ DERRAMADO POR VÓS E POR MUITOS,\nPARA REMISSÃO DOS PECADOS.\nFAZEI ISTO EM MEMÓRIA DE MIM."\n\nEis o mistério da fé!\n— Anunciamos, Senhor, a Vossa morte, proclamamos a Vossa ressurreição. Vinde, Senhor Jesus!', rubric: 'O sacerdote genuflecte após cada consagração. A assembleia se ajoelha.' },
      { label: 'Aclamações da Anamnese', text: 'Opção 1: Anunciamos, Senhor, a Vossa morte, proclamamos a Vossa ressurreição. Vinde, Senhor Jesus!\n\nOpção 2: Todas as vezes que comemos deste Pão e bebemos deste Cálice, anunciamos, Senhor, a Vossa morte, enquanto esperamos a Vossa vinda!\n\nOpção 3: Salvador do mundo, salvai-nos, Vós que nos libertastes pela Cruz e Ressurreição!' },
      { label: 'Doxologia Final', latin: 'Per ipsum, et cum ipso, et in ipso, est tibi Deo Patri omnipoténti, in unitáte Spíritus Sancti, omnis honor et glória per ómnia sǽcula sæculórum. Amen.', text: 'Por Cristo, com Cristo, em Cristo, a Vós, Deus Pai todo-poderoso, na unidade do Espírito Santo, toda a honra e toda a glória, agora e para sempre.\n— Amém.', rubric: 'Apenas o sacerdote eleva o cálice e a patena. A assembleia responde com "Amém" solene.' },
    ]
  },
  {
    id: 'communion', title: 'Rito da Comunhão', subtitle: 'Ritus Communionis',
    parts: [
      { label: 'Pai Nosso', latin: 'Pater noster, qui es in cælis:\nsanctificétur nomen tuum;\nadvéniat regnum tuum;\nfiat volúntas tua,\nsicut in cælo, et in terra.\nPanem nostrum cotidiánum da nobis hódie;\net dimítte nobis débita nostra,\nsicut et nos dimíttimus debitóribus nostris;\net ne nos indúcas in tentatiónem;\nsed líbera nos a malo.', text: 'Pai nosso que estais nos céus,\nsantificado seja o Vosso nome,\nvenha a nós o Vosso Reino,\nseja feita a Vossa vontade,\nassim na terra como no céu.\nO pão nosso de cada dia nos dai hoje,\nperdoai-nos as nossas ofensas,\nassim como nós perdoamos a quem nos tem ofendido,\ne não nos deixeis cair em tentação,\nmas livrai-nos do mal.' },
      { label: 'Embolismo', text: 'Livrai-nos de todos os males, ó Pai, e dai-nos hoje a Vossa paz. Pela Vossa misericórdia, livrai-nos do pecado e de toda perturbação, enquanto, vivendo a esperança, esperamos a vinda do Salvador, Jesus Cristo.\n— Vosso é o Reino, o poder e a glória para sempre!' },
      { label: 'Rito da Paz', text: '"A paz do Senhor esteja sempre convosco." — "O amor de Cristo nos uniu."\n\n"Dai-vos mutuamente a paz."', rubric: 'O gesto de paz é facultativo e adaptável aos costumes locais.' },
      { label: 'Fração do Pão e Cordeiro de Deus', latin: 'Agnus Dei, qui tollis peccáta mundi:\nmiserére nobis.\nAgnus Dei, qui tollis peccáta mundi:\nmiserére nobis.\nAgnus Dei, qui tollis peccáta mundi:\ndona nobis pacem.', text: 'Cordeiro de Deus, que tirais o pecado do mundo,\ntende piedade de nós.\nCordeiro de Deus, que tirais o pecado do mundo,\ntende piedade de nós.\nCordeiro de Deus, que tirais o pecado do mundo,\ndai-nos a paz.', rubric: 'O sacerdote parte a hóstia e coloca um fragmento no cálice.' },
      { label: 'Comunhão', text: '"Eis o Cordeiro de Deus, que tira o pecado do mundo. Felizes os convidados para a Ceia do Senhor."\n\n— "Senhor, eu não sou digno(a) de que entreis em minha morada, mas dizei uma palavra e serei salvo(a)."\n\nOs fiéis recebem o Corpo (e o Sangue) de Cristo.', rubric: 'Pode-se receber de pé ou de joelhos, na mão ou na língua.' },
      { label: 'Oração após a Comunhão', text: 'Após um momento de silêncio ou canto, o sacerdote reza a Oração após a Comunhão própria do dia. A assembleia responde: "Amém."' },
    ]
  },
  {
    id: 'final', title: 'Ritos Finais', subtitle: 'Ritus Conclusionis',
    parts: [
      { label: 'Avisos', text: 'Breves comunicados à comunidade, se necessário.', rubric: 'Antes da bênção final.' },
      { label: 'Bênção Final', latin: 'Benedícat vos omnípotens Deus,\nPater, et Fílius, ✠ et Spíritus Sanctus.\n— Amen.', text: '"O Senhor esteja convosco." — "Ele está no meio de nós."\n\n"Abençoe-vos Deus todo-poderoso, Pai, Filho ✠ e Espírito Santo."\n— "Amém."', rubric: 'Nas solenidades, pode usar-se a bênção solene ou oração sobre o povo.' },
      { label: 'Despedida', latin: 'Ite, missa est. — Deo grátias.\n\nOu: Ite ad Evangelium Dómini annuntiándum. — Deo grátias.', text: '"Ide em paz e o Senhor vos acompanhe."\n— "Graças a Deus."\n\nOu: "Ide anunciar o Evangelho do Senhor."\n— "Graças a Deus."', rubric: 'No tempo pascal acrescenta-se o duplo Aleluia.' },
    ]
  },
];

const MissalPage: React.FC = () => {
  const [showLatin, setShowLatin] = useState(false);
  const [showRubrics, setShowRubrics] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('entrance');

  return (
    <div className="max-w-spacing-4xl mx-auto space-y-spacing-xl">
      <div className="text-center space-y-spacing-sm">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.Cross className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Ordo Missæ</span>
        </div>
        <h1 className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground">Missal Romano</h1>
        <p className="text-muted-foreground font-serif italic max-w-spacing-lg mx-auto">O Ordinário da Santa Missa — 3ª edição típica do Missal Romano.</p>
      </div>

      <div className="flex justify-center gap-spacing-xs flex-wrap">
        <Button onClick={() => setShowLatin(!showLatin)}
          className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-bold transition-all ${showLatin ? 'bg-foreground text-background' : 'bg-card border border-border text-foreground'}`}>
          {showLatin ? '🔤 Latim ativado' : '🔤 Mostrar Latim'}
        </Button>
        <Button onClick={() => setShowRubrics(!showRubrics)}
          className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-bold transition-all ${showRubrics ? 'bg-primary text-secondary border border-secondary/20' : 'bg-card border border-border text-foreground'}`}>
          {showRubrics ? '📕 Rubricas ativadas' : '📕 Mostrar Rubricas'}
        </Button>
      </div>

      {/* Quick navigation */}
      <div className="flex flex-wrap gap-spacing-xs justify-center">
        {MISSAL_SECTIONS.map(section => (
          <Button
            key={section.id}
            onClick={() => {
              setExpandedSection(section.id);
              document.getElementById(`missal-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`px-spacing-sm py-spacing-2xs rounded-premium-full text-premium-xs font-bold uppercase tracking-wider transition-all ${
              expandedSection === section.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-primary border border-border'
            }`}
          >
            {section.title}
          </Button>
        ))}
      </div>

      <div className="space-y-spacing-md">
        {MISSAL_SECTIONS.map(section => (
          <div key={section.id} id={`missal-${section.id}`} className="bg-card border border-border rounded-premium overflow-hidden">
            <Button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full p-spacing-md flex items-center justify-between text-left hover:bg-primary/5 transition-all"
            >
              <div>
                <h3 className="text-premium-lg font-serif font-bold text-foreground">{section.title}</h3>
                {section.subtitle && <p className="text-premium-xs font-bold uppercase tracking-widest text-muted-foreground mt-spacing-3xs">{section.subtitle}</p>}
              </div>
              <Icons.ChevronDown className={`w-spacing-md h-spacing-md text-muted-foreground transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`} />
            </Button>

            {expandedSection === section.id && (
              <div className="border-t border-border divide-y divide-border">
                {section.parts.map((part, i) => (
                  <div key={i} className="p-spacing-md space-y-spacing-sm">
                    <h4 className="text-premium-sm font-black uppercase tracking-widest text-primary">{part.label}</h4>
                    {showRubrics && part.rubric && (
                      <p className="text-premium-xs text-primary font-medium italic bg-secondary/5 rounded-premium-full px-spacing-md py-spacing-xs border border-secondary/10">
                        ✠ {part.rubric}
                      </p>
                    )}
                    {showLatin && part.latin && (
                      <p className="text-premium-sm text-muted-foreground font-serif italic bg-muted rounded-premium-full p-spacing-md whitespace-pre-line">{part.latin}</p>
                    )}
                    <p className="text-premium-sm text-foreground/90 font-serif leading-relaxed whitespace-pre-line">{part.text}</p>
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
