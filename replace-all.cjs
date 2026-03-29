const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');
const appFile = path.join(__dirname, 'App.tsx');

const filesToProcess = [appFile];

if (fs.existsSync(componentsDir)) {
  const componentFiles = fs.readdirSync(componentsDir)
    .filter(f => f.endsWith('.tsx'))
    .map(f => path.join(componentsDir, f));
  filesToProcess.push(...componentFiles);
}

const replacements = [
  // Backgrounds
  { regex: /bg-stone-(900|950|800|100|50)/g, replace: 'bg-nous-base' },
  { regex: /dark:bg-stone-(900|950|800|100|50)/g, replace: '' },
  { regex: /hover:bg-stone-(900|950|800|100|50)/g, replace: 'hover:bg-nous-base' },
  { regex: /dark:hover:bg-stone-(900|950|800|100|50)/g, replace: '' },
  
  // Text
  { regex: /text-stone-(900|800|200|100|50)/g, replace: 'text-nous-text' },
  { regex: /dark:text-stone-(900|800|200|100|50)/g, replace: '' },
  { regex: /hover:text-stone-(900|800|200|100|50)/g, replace: 'hover:text-nous-text' },
  { regex: /dark:hover:text-stone-(900|800|200|100|50)/g, replace: '' },
  
  { regex: /text-stone-(700|600|500|400|300)/g, replace: 'text-nous-subtle' },
  { regex: /dark:text-stone-(700|600|500|400|300)/g, replace: '' },
  { regex: /hover:text-stone-(700|600|500|400|300)/g, replace: 'hover:text-nous-subtle' },
  { regex: /dark:hover:text-stone-(700|600|500|400|300)/g, replace: '' },

  // Borders
  { regex: /border-stone-(900|800|700|600|500|400|300|200|100)/g, replace: 'border-nous-border' },
  { regex: /dark:border-stone-(900|800|700|600|500|400|300|200|100)/g, replace: '' },
  { regex: /hover:border-stone-(900|800|700|600|500|400|300|200|100)/g, replace: 'hover:border-nous-border' },
  { regex: /dark:hover:border-stone-(900|800|700|600|500|400|300|200|100)/g, replace: '' },
  
  // Cleanup double spaces
  { regex: /  +/g, replace: ' ' },
  { regex: / "/g, replace: '"' },
  { regex: /" /g, replace: '"' },
];

for (const filePath of filesToProcess) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const { regex, replace } of replacements) {
    content = content.replace(regex, replace);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${path.basename(filePath)}`);
  }
}
console.log('Done');
