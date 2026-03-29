import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('components');
files.push('App.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Replace `bg-black text-white` with `bg-nous-text text-nous-base`
  if (content.includes('bg-black text-white')) {
    content = content.replace(/bg-black text-white/g, 'bg-nous-text text-nous-base');
    modified = true;
  }
  
  // Replace `bg-white text-black` with `bg-nous-base text-nous-text`
  if (content.includes('bg-white text-black')) {
    content = content.replace(/bg-white text-black/g, 'bg-nous-base text-nous-text');
    modified = true;
  }

  // Let's just replace `dark:bg-white` with ``
  if (content.includes('dark:bg-white')) {
    content = content.replace(/dark:bg-white/g, '');
    modified = true;
  }
  if (content.includes('dark:bg-black')) {
    content = content.replace(/dark:bg-black/g, '');
    modified = true;
  }
  if (content.includes('dark:text-black')) {
    content = content.replace(/dark:text-black/g, '');
    modified = true;
  }
  if (content.includes('dark:border-white')) {
    content = content.replace(/dark:border-white/g, '');
    modified = true;
  }
  if (content.includes('dark:border-black')) {
    content = content.replace(/dark:border-black/g, '');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content);
  }
});

console.log('Done replacing dark mode classes.');
