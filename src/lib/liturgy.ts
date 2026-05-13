
export function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

export function getLiturgicalPeriods(year: number) {
  const easter = computeEaster(year);
  
  // Advent: Sunday closest to Nov 30
  const nov30 = new Date(year, 10, 30);
  const advent = new Date(nov30);
  advent.setDate(30 - nov30.getDay());
  
  // Christmas
  const christmas = new Date(year, 11, 25);
  
  // Lent: 46 days before Easter
  const lent = new Date(easter);
  lent.setDate(lent.getDate() - 46);
  
  // Pentecost: 49 days after Easter
  const pentecost = new Date(easter);
  pentecost.setDate(pentecost.getDate() + 49);

  return [
    { name: 'Advento', date: advent, color: 'roxo' },
    { name: 'Natal', date: christmas, color: 'branco' },
    { name: 'Quaresma', date: lent, color: 'roxo' },
    { name: 'Páscoa', date: easter, color: 'branco' },
    { name: 'Pentecostes', date: pentecost, color: 'vermelho' },
    { name: 'Tempo Comum', date: new Date(year, 0, 13), color: 'verde' },
  ];
}
