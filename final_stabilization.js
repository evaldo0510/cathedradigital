import fs from 'fs';

const files = [
  'src/components/cathedra/NexusBubbles.tsx',
  'src/components/cathedra/TemasPage.tsx',
  'src/components/cathedra/TemaDetailPage.tsx',
  'src/components/cathedra/VisualSilenceControls.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  
  // Ensure Icons is imported
  if (!c.includes("from '@/constants'")) {
    c = "import { Icons } from '@/constants';\n" + c;
  }
  
  // Fix interface Icons.Tag -> interface Tag
  c = c.replace(/interface\s+Icons\.Tag/g, 'interface Tag');
  
  // Fix usage of Tag as type : Icons.Tag -> : Tag
  c = c.replace(/:\s*Icons\.Tag/g, ': Tag');
  c = c.replace(/useFuzzySearch<Icons\.Tag>/g, 'useFuzzySearch<Tag>');
  
  // Fix missing icon references (VolumeX)
  c = c.replace(/icon:\s*VolumeX/g, 'icon: Icons.VolumeX');
  
  // Fix any remaining broken namespaces from previous runs
  c = c.replace(/Icons\.Icons\./g, 'Icons.');
  
  fs.writeFileSync(f, c);
});
