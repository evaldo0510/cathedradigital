import fs from 'fs';
const files = [
  'src/components/cathedra/TemaDetailPage.tsx',
  'src/components/cathedra/TemasPage.tsx',
  'src/components/cathedra/VisualSilenceControls.tsx'
];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes("from '@/constants'")) {
    c = "import { Icons } from '@/constants';\n" + c;
  }
  // Ensure VolumeX is correctly referenced
  c = c.replace(/([^.])VolumeX/g, '$1Icons.VolumeX');
  // Clean up any remaining Lucide namespace issues
  c = c.replace(/Icons\.Icons\./g, 'Icons.');
  fs.writeFileSync(f, c);
});