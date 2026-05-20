export interface DailyRitual {
  verse: {
    text: string;
    ref: string;
  };
  reflection: string;
  catechism: {
    text: string;
    number: string;
  };
  prayer: string;
}

export const DAILY_RITUALS: DailyRitual[] = [
  {
    verse: { text: 'Sede misericordiosos como vosso Pai é misericordioso.', ref: 'Lc 6,36' },
    reflection: 'Hoje, acolha a misericórdia divina como dom gratuito. Deixe que ela transforme os seus julgamentos em compaixão.',
    catechism: { text: 'A misericórdia de Deus é a sua onipotência manifestada na paciência e no perdão.', number: '210' },
    prayer: 'Pai de Bondade, que eu saiba olhar para os meus irmãos com os vossos olhos de misericórdia. Amém.'
  },
  {
    verse: { text: 'Eu sou o caminho, a verdade e a vida.', ref: 'Jo 14,6' },
    reflection: 'O caminho de Cristo não é uma estrada fácil, mas é a única que conduz à plenitude. Caminhe com confiança.',
    catechism: { text: 'Jesus Cristo é o Mediador e a plenitude de toda a Revelação.', number: '65' },
    prayer: 'Senhor Jesus, guiai meus passos no caminho da verdade para que eu nunca me perca de Vós. Amém.'
  },
  {
    verse: { text: 'Vinde a mim todos vós que estais cansados e eu vos aliviarei.', ref: 'Mt 11,28' },
    reflection: 'Nos momentos de cansaço, lembre-se: Jesus não pede que sejamos fortes sozinhos. Ele carrega conosco o peso do dia.',
    catechism: { text: 'A oração é o encontro da sede de Deus com a nossa sede.', number: '2560' },
    prayer: 'Doce Jesus, descanso da minha alma, em Vós deposito minhas fadigas e encontro renovação. Amém.'
  },
  {
    verse: { text: 'Não tenhais medo, eu venci o mundo.', ref: 'Jo 16,33' },
    reflection: 'O medo paralisa, mas a fé liberta. Confie n\'Aquele que já venceu todas as batalhas por você.',
    catechism: { text: 'Pela fé, o homem submete completamente a sua inteligência e a sua vontade a Deus.', number: '143' },
    prayer: 'Senhor, aumentai a minha fé para que nenhum medo terreno possa abalar minha confiança em Vós. Amém.'
  },
  {
    verse: { text: 'Amai-vos uns aos outros como eu vos amei.', ref: 'Jo 15,12' },
    reflection: 'O amor verdadeiro não é sentimento passageiro; é decisão diária de entregar-se ao próximo como Cristo se entregou.',
    catechism: { text: 'O amor de Deus é a fonte de onde brota o amor ao próximo.', number: '1822' },
    prayer: 'Espírito Santo, inflamai meu coração com o fogo do Vosso amor para que eu ame como Jesus amou. Amém.'
  }
];

export const DAILY_VERSES = [
  { text: 'Sede misericordiosos como vosso Pai é misericordioso.', ref: 'Lc 6,36' },
// ... keep existing code
  { text: 'Tu és o meu Deus, em Ti confio.', ref: 'Sl 31,14' },
  { text: 'Quem nos separará do amor de Cristo?', ref: 'Rm 8,35' },
];

export const DAILY_REFLECTIONS = [
  'Hoje, acolha a misericórdia divina como dom gratuito. Deixe que ela transforme os seus julgamentos em compaixão.',
// ... keep existing code
  { text: 'A fé sem obras é morta. Que suas ações hoje falem mais alto que suas palavras sobre o que você crê.', ref: 'Tg 2,17' },
  { text: 'O segredo da felicidade está em buscar primeiro o Reino de Deus. O resto será acrescentado.', ref: 'Mt 6,33' },
  { text: 'A cruz que você carrega hoje é o seu caminho de glória amanhã. Una seus sofrimentos aos de Jesus.', ref: 'Mt 16,24' },
];