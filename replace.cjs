const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'StrategyStudio.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
  'bg-stone-950': 'bg-nous-base',
  'text-stone-200': 'text-nous-text',
  'text-stone-800': 'text-nous-text',
  'text-stone-900': 'text-nous-text',
  'text-stone-500': 'text-nous-subtle',
  'text-stone-700': 'text-nous-subtle',
  'border-stone-800': 'border-nous-border',
  'border-stone-300': 'border-nous-border',
  'border-stone-500': 'border-nous-border',
  'border-stone-900': 'border-nous-border',
  'bg-stone-900': 'bg-nous-base',
  'bg-stone-800': 'bg-nous-base',
  'bg-stone-100': 'bg-nous-base',
  'hover:bg-stone-900': 'hover:bg-nous-base',
  'hover:bg-stone-800': 'hover:bg-nous-base',
  'hover:bg-stone-100': 'hover:bg-nous-base',
  'hover:border-stone-500': 'hover:border-nous-border',
  'hover:border-stone-600': 'hover:border-nous-border',
  'hover:text-stone-500': 'hover:text-nous-subtle',
  'hover:text-stone-800': 'hover:text-nous-text',
  'hover:text-stone-200': 'hover:text-nous-text',
  'hover:text-white': 'hover:text-nous-text',
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync(filePath, content);
console.log('Done');
