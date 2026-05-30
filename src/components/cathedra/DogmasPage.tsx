import { Button } from '@/components/ui/button';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import { AppRoute, DeepContent } from '@/types';
import { Badge } from '@/components/ui/badge';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import MagisteriumPopover from './MagisteriumPopover';
import DeepContentSection from './DeepContentSection';

interface DogmaRef {
  type: 'bible' | 'catechism' | 'magisterium';
  label: string;
  /** For bible: "book chapter" (e.g. "Mt 16"), for catechism: paragraph number, for magisterium: search query */
  target: string;
}

interface Dogma extends Partial<DeepContent> {
  id: number;
  title: string;
  definition: string;
  source: string;
  year: number;
  category: string;
  refs: DogmaRef[];
}

const CATEGORIES = ['Todos', 'Deus', 'Cristologia', 'Mariologia', 'Eclesiologia', 'Sacramentos', 'Escatologia', 'Antropologia', 'Graça', 'Anjos', 'Escritura'];

const DOGMAS: Dogma[] = [
  { id: 1, title: 'Existência de Deus', definition: 'A existência de Deus pode ser conhecida com certeza pela luz natural da razão humana, a partir das coisas criadas.', source: 'Concílio Vaticano I, Dei Filius', year: 1870, category: 'Deus', refs: [
    { type: 'bible', label: 'Rm 1,20', target: 'Rom 1' },
    { type: 'bible', label: 'Sb 13,1-9', target: 'Wis 13' },
    { type: 'catechism', label: 'CIC §36', target: '36' },
    { type: 'catechism', label: 'CIC §286', target: '286' },
    { type: 'magisterium', label: 'Dei Filius', target: 'Dei Filius' },
  ],
  textoBase: 'Desde a criação do mundo, as perfeições invisíveis de Deus, o seu poder eterno e a sua divindade, tornam-se visíveis à inteligência, por meio das suas obras.',
  explicacao: 'A Igreja ensina que não precisamos de uma revelação sobrenatural para saber que Deus existe. Apenas observando a ordem do universo, a beleza da natureza e a complexidade da vida, nossa inteligência pode concluir, com certeza, que existe um Criador.',
  interpretacaoProfunda: 'Este dogma protege a dignidade da razão humana contra o fideísmo (que diz que só a fé importa) e contra o ateísmo materialista. Ele afirma que o mundo é um "livro" escrito por Deus, onde cada criatura é uma palavra que aponta para o seu Autor.',
  aplicacaoPratica: 'Tente hoje olhar para uma flor, para o céu ou para a complexidade do seu próprio corpo não apenas como matéria, mas como um sinal. Deixe que a beleza do mundo te leve a um pensamento de gratidão ao Criador.',
  reflexaoFinal: 'Se eu pudesse ver a "assinatura" de Deus em cada coisa que encontro hoje, como isso mudaria meu humor?',
  exercicio: 'Saia de casa ou olhe pela janela por 2 minutos. Escolha um elemento da natureza e tente encontrar nele um motivo para dizer: "Obrigado, Senhor, por teres criado isso".'
  },
  { id: 2, title: 'Santíssima Trindade', definition: 'Há em Deus três Pessoas divinas: Pai, Filho e Espírito Santo. Cada uma das três Pessoas possui a essência divina inteira.', source: 'Concílio de Nicéia / Constantinopla', year: 325, category: 'Deus', refs: [
    { type: 'bible', label: 'Mt 28,19', target: 'Mat 28' },
    { type: 'bible', label: '2Cor 13,13', target: '2Co 13' },
    { type: 'catechism', label: 'CIC §253-256', target: '253' },
    { type: 'magisterium', label: 'Credo Niceno', target: 'Credo Niceno' },
  ]},
  { id: 3, title: 'Criação ex nihilo', definition: 'Deus criou todas as coisas do nada (ex nihilo), livremente e por bondade.', source: 'Concílio Lateranense IV', year: 1215, category: 'Deus', refs: [
    { type: 'bible', label: 'Gn 1,1', target: 'Gen 1' },
    { type: 'bible', label: '2Mac 7,28', target: '2Ma 7' },
    { type: 'catechism', label: 'CIC §296-298', target: '296' },
  ]},
  { id: 4, title: 'Divindade de Cristo', definition: 'Jesus Cristo é verdadeiro Deus e verdadeiro homem, com duas naturezas — divina e humana — unidas na única Pessoa do Verbo.', source: 'Concílio de Calcedônia', year: 451, category: 'Cristologia', refs: [
    { type: 'bible', label: 'Jo 1,1-14', target: 'Joh 1' },
    { type: 'bible', label: 'Cl 2,9', target: 'Col 2' },
    { type: 'catechism', label: 'CIC §464-469', target: '464' },
  ]},
  { id: 5, title: 'Encarnação do Verbo', definition: 'O Verbo se fez carne e habitou entre nós. O Filho de Deus assumiu a natureza humana no seio da Virgem Maria.', source: 'Concílio de Éfeso / Nicéia', year: 431, category: 'Cristologia', refs: [
    { type: 'bible', label: 'Jo 1,14', target: 'Joh 1' },
    { type: 'bible', label: 'Lc 1,35', target: 'Luk 1' },
    { type: 'catechism', label: 'CIC §461-463', target: '461' },
  ]},
  { id: 6, title: 'Redenção pela Cruz', definition: 'Cristo morreu na cruz para a redenção de todos os homens, oferecendo-se como sacrifício ao Pai para a remissão dos pecados.', source: 'Concílio de Trento', year: 1545, category: 'Cristologia', refs: [
    { type: 'bible', label: 'Rm 5,8-10', target: 'Rom 5' },
    { type: 'bible', label: 'Hb 9,12', target: 'Heb 9' },
    { type: 'catechism', label: 'CIC §613-617', target: '613' },
  ]},
  { id: 7, title: 'Ressurreição de Cristo', definition: 'Ao terceiro dia, Cristo ressuscitou dentre os mortos com seu próprio corpo glorificado.', source: 'Símbolo dos Apóstolos / Nicéia', year: 325, category: 'Cristologia', refs: [
    { type: 'bible', label: '1Cor 15,3-8', target: '1Co 15' },
    { type: 'bible', label: 'Mc 16,6', target: 'Mar 16' },
    { type: 'catechism', label: 'CIC §638-658', target: '638' },
  ]},
  { id: 8, title: 'Ascensão ao Céu', definition: 'Quarenta dias após a Ressurreição, Cristo subiu aos Céus em corpo e alma e está sentado à direita do Pai.', source: 'Símbolo Niceno-Constantinopolitano', year: 381, category: 'Cristologia', refs: [
    { type: 'bible', label: 'At 1,9-11', target: 'Act 1' },
    { type: 'bible', label: 'Mc 16,19', target: 'Mar 16' },
    { type: 'catechism', label: 'CIC §659-667', target: '659' },
  ]},
  { id: 9, title: 'Imaculada Conceição', definition: 'A Virgem Maria, no primeiro instante de sua conceição, foi preservada imune de toda mancha do pecado original.', source: 'Pio IX, Ineffabilis Deus', year: 1854, category: 'Mariologia', refs: [
    { type: 'bible', label: 'Lc 1,28', target: 'Luk 1' },
    { type: 'bible', label: 'Gn 3,15', target: 'Gen 3' },
    { type: 'catechism', label: 'CIC §490-493', target: '490' },
    { type: 'magisterium', label: 'Ineffabilis Deus', target: 'Ineffabilis Deus' },
  ]},
  { id: 10, title: 'Virgindade Perpétua de Maria', definition: 'Maria foi virgem antes, durante e depois do parto de Jesus Cristo.', source: 'Concílio de Latrão (649)', year: 649, category: 'Mariologia', refs: [
    { type: 'bible', label: 'Is 7,14', target: 'Isa 7' },
    { type: 'bible', label: 'Lc 1,34', target: 'Luk 1' },
    { type: 'catechism', label: 'CIC §496-507', target: '496' },
  ]},
  { id: 11, title: 'Maternidade Divina', definition: 'Maria é verdadeiramente Mãe de Deus (Theotókos), pois gerou segundo a carne o Verbo de Deus feito carne.', source: 'Concílio de Éfeso', year: 431, category: 'Mariologia', refs: [
    { type: 'bible', label: 'Lc 1,43', target: 'Luk 1' },
    { type: 'bible', label: 'Gl 4,4', target: 'Gal 4' },
    { type: 'catechism', label: 'CIC §495', target: '495' },
  ]},
  { id: 12, title: 'Assunção de Maria', definition: 'A Virgem Maria, terminado o curso da vida terrena, foi assunta em corpo e alma à glória celestial.', source: 'Pio XII, Munificentissimus Deus', year: 1950, category: 'Mariologia', refs: [
    { type: 'bible', label: 'Ap 12,1', target: 'Rev 12' },
    { type: 'catechism', label: 'CIC §966', target: '966' },
    { type: 'magisterium', label: 'Munificentissimus Deus', target: 'Munificentissimus Deus' },
  ]},
  { id: 13, title: 'Presença Real na Eucaristia', definition: 'Na Eucaristia, o pão e o vinho são convertidos no Corpo e Sangue de Cristo (transubstanciação). Cristo está verdadeira, real e substancialmente presente.', source: 'Concílio de Trento', year: 1551, category: 'Sacramentos', refs: [
    { type: 'bible', label: 'Mt 26,26-28', target: 'Mat 26' },
    { type: 'bible', label: '1Cor 11,24-25', target: '1Co 11' },
    { type: 'catechism', label: 'CIC §1373-1381', target: '1373' },
  ]},
  { id: 14, title: 'Sete Sacramentos', definition: 'Os sacramentos da Nova Lei foram todos instituídos por Jesus Cristo e são sete: Batismo, Confirmação, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio.', source: 'Concílio de Trento', year: 1547, category: 'Sacramentos', refs: [
    { type: 'catechism', label: 'CIC §1210-1211', target: '1210' },
  ]},
  { id: 15, title: 'Necessidade do Batismo', definition: 'O Batismo é necessário para a salvação, ao menos em desejo (in voto), pois é a porta de entrada na Igreja e confere a graça santificante.', source: 'Concílio de Trento', year: 1547, category: 'Sacramentos', refs: [
    { type: 'bible', label: 'Jo 3,5', target: 'Joh 3' },
    { type: 'bible', label: 'Mc 16,16', target: 'Mar 16' },
    { type: 'catechism', label: 'CIC §1257-1261', target: '1257' },
  ]},
  { id: 16, title: 'Pecado Original', definition: 'Pelo pecado de Adão, todos os homens nascem em estado de pecado original, privados da graça santificante.', source: 'Concílio de Trento', year: 1546, category: 'Antropologia', refs: [
    { type: 'bible', label: 'Rm 5,12', target: 'Rom 5' },
    { type: 'bible', label: 'Gn 3,1-24', target: 'Gen 3' },
    { type: 'catechism', label: 'CIC §388-390', target: '388' },
  ]},
  { id: 17, title: 'Imortalidade da Alma', definition: 'A alma humana é imortal e subsiste após a morte do corpo, aguardando a ressurreição final.', source: 'Concílio Lateranense V', year: 1513, category: 'Antropologia', refs: [
    { type: 'bible', label: 'Sb 3,1-4', target: 'Wis 3' },
    { type: 'bible', label: 'Mt 10,28', target: 'Mat 10' },
    { type: 'catechism', label: 'CIC §366', target: '366' },
  ]},
  { id: 18, title: 'Livre-arbítrio', definition: 'O homem possui livre-arbítrio, pelo qual pode cooperar ou resistir à graça divina.', source: 'Concílio de Trento', year: 1547, category: 'Antropologia', refs: [
    { type: 'bible', label: 'Eclo 15,14-17', target: 'Sir 15' },
    { type: 'catechism', label: 'CIC §1730-1738', target: '1730' },
  ]},
  { id: 19, title: 'Infalibilidade Papal', definition: 'O Romano Pontífice, quando fala ex cathedra em matéria de fé e moral, goza de infalibilidade, assistido pelo Espírito Santo.', source: 'Concílio Vaticano I, Pastor Aeternus', year: 1870, category: 'Eclesiologia', refs: [
    { type: 'bible', label: 'Mt 16,18-19', target: 'Mat 16' },
    { type: 'bible', label: 'Lc 22,32', target: 'Luk 22' },
    { type: 'catechism', label: 'CIC §891', target: '891' },
    { type: 'magisterium', label: 'Pastor Aeternus', target: 'Pastor Aeternus' },
  ]},
  { id: 20, title: 'Primado de Pedro', definition: 'Cristo constituiu São Pedro como chefe visível de toda a Igreja, conferindo-lhe o primado de jurisdição. Este primado é transmitido aos seus sucessores, os Bispos de Roma.', source: 'Concílio Vaticano I', year: 1870, category: 'Eclesiologia', refs: [
    { type: 'bible', label: 'Mt 16,18-19', target: 'Mat 16' },
    { type: 'bible', label: 'Jo 21,15-17', target: 'Joh 21' },
    { type: 'catechism', label: 'CIC §880-882', target: '880' },
  ]},
  { id: 21, title: 'A Igreja como Corpo de Cristo', definition: 'A Igreja é o Corpo Místico de Cristo, do qual Ele é a Cabeça e os fiéis são os membros.', source: 'Pio XII, Mystici Corporis', year: 1943, category: 'Eclesiologia', refs: [
    { type: 'bible', label: '1Cor 12,12-27', target: '1Co 12' },
    { type: 'bible', label: 'Ef 1,22-23', target: 'Eph 1' },
    { type: 'catechism', label: 'CIC §787-795', target: '787' },
    { type: 'magisterium', label: 'Mystici Corporis', target: 'Mystici Corporis' },
  ]},
  { id: 22, title: 'Comunhão dos Santos', definition: 'Existe uma comunhão espiritual entre os fiéis na terra, as almas no purgatório e os bem-aventurados no céu.', source: 'Símbolo dos Apóstolos', year: 390, category: 'Eclesiologia', refs: [
    { type: 'bible', label: '1Cor 12,26', target: '1Co 12' },
    { type: 'catechism', label: 'CIC §946-962', target: '946' },
  ]},
  { id: 23, title: 'Existência do Purgatório', definition: 'Existe o purgatório, onde as almas dos justos que morreram com pecados veniais ou penas temporais são purificadas antes de entrar no céu.', source: 'Concílio de Florença / Trento', year: 1439, category: 'Escatologia', refs: [
    { type: 'bible', label: '2Mac 12,46', target: '2Ma 12' },
    { type: 'bible', label: '1Cor 3,15', target: '1Co 3' },
    { type: 'catechism', label: 'CIC §1030-1032', target: '1030' },
  ]},
  { id: 24, title: 'Ressurreição dos Mortos', definition: 'No último dia, todos os mortos ressuscitarão com seus próprios corpos para o juízo final.', source: 'Símbolo Niceno-Constantinopolitano', year: 381, category: 'Escatologia', refs: [
    { type: 'bible', label: 'Jo 5,28-29', target: 'Joh 5' },
    { type: 'bible', label: '1Cor 15,42-44', target: '1Co 15' },
    { type: 'catechism', label: 'CIC §988-1004', target: '988' },
  ]},
  { id: 25, title: 'Juízo Final', definition: 'No fim dos tempos, Cristo virá em glória para julgar os vivos e os mortos, dando a cada um segundo as suas obras.', source: 'Símbolo Niceno / Atanasiano', year: 325, category: 'Escatologia', refs: [
    { type: 'bible', label: 'Mt 25,31-46', target: 'Mat 25' },
    { type: 'bible', label: 'Ap 20,12', target: 'Rev 20' },
    { type: 'catechism', label: 'CIC §1038-1041', target: '1038' },
  ]},
  { id: 26, title: 'Existência do Inferno', definition: 'O inferno existe e as almas dos que morrem em pecado mortal são condenadas às penas eternas.', source: 'Concílio de Florença / Trento', year: 1439, category: 'Escatologia', refs: [
    { type: 'bible', label: 'Mt 25,41', target: 'Mat 25' },
    { type: 'bible', label: 'Mc 9,43-48', target: 'Mar 9' },
    { type: 'catechism', label: 'CIC §1033-1037', target: '1033' },
  ]},
  { id: 27, title: 'Existência do Céu', definition: 'Os bem-aventurados gozam no céu da visão beatífica de Deus, face a face, numa felicidade eterna e perfeita.', source: 'Bento XII, Benedictus Deus', year: 1336, category: 'Escatologia', refs: [
    { type: 'bible', label: '1Cor 13,12', target: '1Co 13' },
    { type: 'bible', label: '1Jo 3,2', target: '1Jn 3' },
    { type: 'catechism', label: 'CIC §1023-1029', target: '1023' },
    { type: 'magisterium', label: 'Benedictus Deus', target: 'Benedictus Deus' },
  ]},
  // --- Graça Divina ---
  { id: 28, title: 'Necessidade da Graça', definition: 'Sem a graça de Deus, o homem não pode realizar nenhum ato salutar nem merecer a vida eterna. A graça é absolutamente necessária para o início da fé e da justificação.', source: 'Concílio de Trento / II de Orange', year: 1547, category: 'Graça', refs: [
    { type: 'bible', label: 'Jo 15,5', target: 'Joh 15' },
    { type: 'bible', label: 'Fl 2,13', target: 'Phi 2' },
    { type: 'catechism', label: 'CIC §1996-2000', target: '1996' },
  ]},
  { id: 29, title: 'Graça Santificante', definition: 'A graça santificante é um dom habitual, uma disposição estável e sobrenatural que aperfeiçoa a alma para torná-la capaz de viver com Deus e agir por seu amor.', source: 'Concílio de Trento', year: 1547, category: 'Graça', refs: [
    { type: 'bible', label: '2Pd 1,4', target: '2Pe 1' },
    { type: 'bible', label: '2Cor 5,17', target: '2Co 5' },
    { type: 'catechism', label: 'CIC §1999-2000', target: '1999' },
  ]},
  { id: 30, title: 'Gratuidade da Graça', definition: 'A graça de Deus é inteiramente gratuita; não é devida por nenhum mérito natural do homem, mas concedida livremente por Deus.', source: 'Concílio de Trento / II de Orange', year: 529, category: 'Graça', refs: [
    { type: 'bible', label: 'Ef 2,8-9', target: 'Eph 2' },
    { type: 'bible', label: 'Rm 3,24', target: 'Rom 3' },
    { type: 'catechism', label: 'CIC §2007-2011', target: '2007' },
  ]},
  { id: 31, title: 'Justificação pela Graça', definition: 'A justificação é a passagem do estado de pecado ao estado de graça e de filiação divina, operada pela graça de Deus através da fé e dos sacramentos.', source: 'Concílio de Trento', year: 1547, category: 'Graça', refs: [
    { type: 'bible', label: 'Rm 3,28', target: 'Rom 3' },
    { type: 'bible', label: 'Tt 3,5-7', target: 'Tit 3' },
    { type: 'catechism', label: 'CIC §1987-1995', target: '1987' },
  ]},
  { id: 32, title: 'Mérito das Boas Obras', definition: 'O justo pode verdadeiramente merecer o aumento da graça e a vida eterna pelas suas boas obras, realizadas em estado de graça e sob a moção do Espírito Santo.', source: 'Concílio de Trento', year: 1547, category: 'Graça', refs: [
    { type: 'bible', label: 'Mt 25,34-40', target: 'Mat 25' },
    { type: 'bible', label: '2Tm 4,7-8', target: '2Ti 4' },
    { type: 'catechism', label: 'CIC §2006-2011', target: '2006' },
  ]},
  // --- Anjos ---
  { id: 33, title: 'Existência dos Anjos', definition: 'Os anjos são seres espirituais, pessoais, dotados de inteligência e vontade, criados por Deus como seus servidores e mensageiros.', source: 'Concílio Lateranense IV / Vaticano I', year: 1215, category: 'Anjos', refs: [
    { type: 'bible', label: 'Sl 148,2-5', target: 'Psa 148' },
    { type: 'bible', label: 'Cl 1,16', target: 'Col 1' },
    { type: 'catechism', label: 'CIC §328-336', target: '328' },
  ]},
  { id: 34, title: 'Anjos da Guarda', definition: 'Deus designa a cada fiel um anjo da guarda para protegê-lo, iluminá-lo e guiá-lo durante a vida terrena.', source: 'Tradição constante da Igreja', year: 0, category: 'Anjos', refs: [
    { type: 'bible', label: 'Mt 18,10', target: 'Mat 18' },
    { type: 'bible', label: 'Sl 91,11-12', target: 'Psa 91' },
    { type: 'catechism', label: 'CIC §336', target: '336' },
  ]},
  { id: 35, title: 'Queda dos Anjos', definition: 'Alguns anjos, criados bons por Deus, tornaram-se maus por sua própria escolha livre ao rebelarem-se contra Deus. São chamados demônios ou anjos caídos.', source: 'Concílio Lateranense IV', year: 1215, category: 'Anjos', refs: [
    { type: 'bible', label: '2Pd 2,4', target: '2Pe 2' },
    { type: 'bible', label: 'Jd 1,6', target: 'Jud 1' },
    { type: 'bible', label: 'Ap 12,7-9', target: 'Rev 12' },
    { type: 'catechism', label: 'CIC §391-395', target: '391' },
  ]},
  // --- Sagrada Escritura ---
  { id: 36, title: 'Inspiração Divina da Escritura', definition: 'Os livros da Sagrada Escritura foram escritos sob a inspiração do Espírito Santo e têm Deus como autor principal, que se serviu de autores humanos como instrumentos.', source: 'Concílio Vaticano I, Dei Filius / Vaticano II, Dei Verbum', year: 1870, category: 'Escritura', refs: [
    { type: 'bible', label: '2Tm 3,16', target: '2Ti 3' },
    { type: 'bible', label: '2Pd 1,20-21', target: '2Pe 1' },
    { type: 'catechism', label: 'CIC §105-108', target: '105' },
    { type: 'magisterium', label: 'Dei Verbum', target: 'Dei Verbum' },
  ]},
  { id: 37, title: 'Inerrância da Escritura', definition: 'A Sagrada Escritura ensina, sem erro, as verdades que Deus quis consignar para nossa salvação.', source: 'Concílio Vaticano II, Dei Verbum 11', year: 1965, category: 'Escritura', refs: [
    { type: 'bible', label: 'Jo 17,17', target: 'Joh 17' },
    { type: 'catechism', label: 'CIC §107', target: '107' },
    { type: 'magisterium', label: 'Dei Verbum', target: 'Dei Verbum' },
  ]},
  { id: 38, title: 'Cânon das Escrituras', definition: 'O cânon da Bíblia compreende 46 livros do Antigo Testamento e 27 do Novo Testamento, definidos solenemente pela Igreja.', source: 'Concílio de Trento', year: 1546, category: 'Escritura', refs: [
    { type: 'catechism', label: 'CIC §120', target: '120' },
    { type: 'magisterium', label: 'Decreto Sacrosanctis', target: 'Decreto Sacrosanctis Trento' },
  ]},
  { id: 39, title: 'Escritura e Tradição', definition: 'A Sagrada Escritura e a Tradição Apostólica constituem juntas o depósito sagrado da Palavra de Deus, confiado à Igreja.', source: 'Concílio Vaticano II, Dei Verbum 9-10', year: 1965, category: 'Escritura', refs: [
    { type: 'bible', label: '2Ts 2,15', target: '2Th 2' },
    { type: 'bible', label: '1Tm 6,20', target: '1Ti 6' },
    { type: 'catechism', label: 'CIC §80-83', target: '80' },
    { type: 'magisterium', label: 'Dei Verbum', target: 'Dei Verbum' },
  ]},
];

const CATEGORY_COLORS: Record<string, string> = {
  'Deus': 'bg-secondary/10 text-secondary border border-secondary/20',
  'Cristologia': 'bg-primary/5 text-primary border border-primary/20',
  'Mariologia': 'bg-secondary/10 text-secondary border border-secondary/20',
  'Sacramentos': 'bg-primary/5 text-primary border border-primary/20',
  'Eclesiologia': 'bg-secondary/10 text-secondary border border-secondary/20',
  'Escatologia': 'bg-primary/5 text-primary border border-primary/20',
  'Antropologia': 'bg-secondary/10 text-secondary border border-secondary/20',
  'Graça': 'bg-primary/5 text-primary border border-primary/20',
  'Anjos': 'bg-secondary/10 text-secondary border border-secondary/20',
  'Escritura': 'bg-primary/5 text-primary border border-primary/20',
};

const REF_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  bible: { icon: <Icons.Book className="w-spacing-sm h-spacing-sm" />, color: 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10' },
  catechism: { icon: <Icons.Heart className="w-spacing-sm h-spacing-sm" />, color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/50' },
  magisterium: { icon: <Icons.Globe className="w-spacing-sm h-spacing-sm" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50' },
};

const DogmasPage: React.FC = () => {
  const [category, setCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let list = DOGMAS;
    if (category !== 'Todos') list = list.filter(d => d.category === category);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.definition.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q)
      );
    }
    return list;
  }, [category, searchQuery]);

  const handleRefClick = (ref: DogmaRef) => {
    switch (ref.type) {
      case 'bible':
        navigate(`${AppRoute.BIBLE}?search=${encodeURIComponent(ref.target)}`);
        break;
      case 'catechism':
        navigate(`${AppRoute.CATECHISM}?paragraph=${ref.target}`);
        break;
      case 'magisterium':
        navigate(`${AppRoute.MAGISTERIUM}?search=${encodeURIComponent(ref.target)}`);
        break;
    }
  };

  return (
    <>
    <SEOHead title="Dogmas da Fé Católica" description="Estude os dogmas da fé católica com referências bíblicas, do catecismo e do magistério. Depositum Fidei completo." path="/dogmas" keywords="dogmas católicos, depositum fidei, doutrina da igreja, verdades de fé" breadcrumbs={[{ name: "Início", path: "/" }, { name: "Dogmas", path: "/dogmas" }]} />
    <div className="max-w-5xl mx-auto space-y-spacing-xl">
      <div className="text-center space-y-spacing-sm">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.Star className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Depositum Fidei</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Dogmas da Fé Católica</h1>
        <p className="text-muted-foreground font-serif italic max-w-spacing-xl mx-auto">
          Verdades divinamente reveladas, definidas solenemente pela Igreja como parte do depósito da fé.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-spacing-md mx-auto relative">
        <Icons.Search className="absolute left-spacing-md top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground" />
        <input
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar dogma, definição ou concílio..."
          className="w-full pl-spacing-xl pr-spacing-md py-spacing-sm rounded-full border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-spacing-xs justify-center flex-wrap">
        {CATEGORIES.map(cat => (
          <Button key={cat} onClick={() => setCategory(cat)}
            className={`px-spacing-md py-spacing-xs rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              category === cat ? 'bg-foreground text-background shadow-premium' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {cat}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-spacing-lg text-center">
        <div>
          <p className="text-2xl font-serif font-bold text-foreground">{filtered.length}</p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Dogmas</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-foreground">{new Set(filtered.map(d => d.category)).size}</p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Categorias</p>
        </div>
      </div>

      {/* Dogmas list */}
      <div className="space-y-spacing-sm">
        {filtered.map(dogma => (
          <div key={dogma.id}
            className="bg-card border border-border rounded-full overflow-hidden transition-all hover:border-primary/30">
            <Button
              onClick={() => setExpandedId(expandedId === dogma.id ? null : dogma.id)}
              className="w-full text-left p-spacing-lg flex items-start gap-spacing-md"
            >
              <span className="text-2xl font-serif font-bold text-primary/60 shrink-0 w-spacing-xl">{dogma.id}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-spacing-xs mb-spacing-2xs flex-wrap">
                  <span className={`px-spacing-xs py-spacing-3xs rounded-full text-xs font-black uppercase tracking-widest ${CATEGORY_COLORS[dogma.category] || 'bg-muted text-muted-foreground'}`}>
                    {dogma.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{dogma.year}</span>
                  {dogma.refs.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-spacing-2xs px-spacing-2xs py-0">
                      <Icons.ExternalLink className="w-spacing-xs h-spacing-xs" /> {dogma.refs.length} fontes
                    </Badge>
                  )}
                </div>
                <h3 className="text-base font-bold text-foreground">{dogma.title}</h3>
                {expandedId !== dogma.id && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-spacing-2xs">{dogma.definition}</p>
                )}
              </div>
              <Icons.ArrowDown className={`w-spacing-md h-spacing-md text-muted-foreground shrink-0 transition-transform ${expandedId === dogma.id ? 'rotate-180' : ''}`} />
            </Button>
            {expandedId === dogma.id && (
              <div className="px-spacing-lg pb-spacing-lg pl-[4.5rem] space-y-spacing-md border-t border-border pt-spacing-md">
                <p className="text-foreground/90 leading-relaxed font-serif">{dogma.definition}</p>
                <div className="flex items-center gap-spacing-xs">
                  <span className="text-xs font-black uppercase tracking-widest text-primary">Fonte:</span>
                  <span className="text-sm text-muted-foreground">{dogma.source} ({dogma.year})</span>
                </div>

                {/* Deep Content Section for Dogmas */}
                {dogma.textoBase && (
                  <div className="pt-spacing-md border-t border-border/40">
                    <DeepContentSection 
                      content={{
                        textoBase: dogma.textoBase,
                        explicacao: dogma.explicacao || '',
                        interpretacaoProfunda: dogma.interpretacaoProfunda || '',
                        aplicacaoPratica: dogma.aplicacaoPratica || '',
                        reflexaoFinal: dogma.reflexaoFinal || '',
                        exercicio: dogma.exercicio || ''
                      }} 
                      contentType="other"
                      title="Aprofundamento Dogmático" 
                    />
                  </div>
                )}

                {/* Cross-references */}
                {dogma.refs.length > 0 && (
                  <div className="space-y-spacing-xs">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aprofundar nas fontes:</span>
                    <div className="flex flex-wrap gap-spacing-xs">
                      {dogma.refs.map((ref, i) => {
                        if (ref.type === 'bible') {
                          const parts = ref.target.split(' ');
                          const abbr = parts[0];
                          const chapter = parseInt(parts[1] || '1', 10);
                          return (
                            <BibleVersePopover
                              key={i}
                              abbr={abbr}
                              chapter={chapter}
                              label={ref.label}
                              onNavigate={(a, c) => navigate(`${AppRoute.BIBLE}?search=${encodeURIComponent(a + ' ' + c)}`)}
                            />
                          );
                        }
                        if (ref.type === 'catechism') {
                          const paragraph = parseInt(ref.target, 10);
                          return (
                            <CatechismPopover
                              key={i}
                              paragraph={paragraph}
                              onNavigate={(p) => navigate(`${AppRoute.CATECHISM}?paragraph=${p}`)}
                            />
                          );
                        }
                        // magisterium — popover
                        return (
                          <MagisteriumPopover
                            key={i}
                            documentName={ref.target}
                            label={ref.label}
                            onNavigate={(search) => navigate(`${AppRoute.MAGISTERIUM}?search=${encodeURIComponent(search)}`)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default DogmasPage;
