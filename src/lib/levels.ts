export const LEVELS = [
  { name: 'Catecúmeno', minXp: 0 },
  { name: 'Peregrino', minXp: 100 },
  { name: 'Acólito', minXp: 300 },
  { name: 'Leitor', minXp: 600 },
  { name: 'Discípulo', minXp: 1000 },
  { name: 'Apologista', minXp: 1800 },
  { name: 'Teólogo', minXp: 3000 },
  { name: 'Doutor da Fé', minXp: 5000 },
  { name: 'Mestre Erudito', minXp: 8000 },
  { name: 'Patriarca', minXp: 12000 },
];

export function getLevelInfo(xp: number) {
  const idx = LEVELS.reduce((acc, lvl, i) => xp >= lvl.minXp ? i : acc, 0);
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next
    ? ((xp - current.minXp) / (next.minXp - current.minXp)) * 100
    : 100;
  return { levelIdx: idx, levelName: current.name, nextLevel: next, progress };
}
