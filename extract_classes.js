import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  const subdirs = fs.readdirSync(dir);
  const files = subdirs.map((subdir) => {
    const res = path.resolve(dir, subdir);
    return fs.statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return files.reduce((a, f) => a.concat(f), []);
}

const appDir = 'c:/anti/PAGESPEED PROJECT/app';
const files = getFiles(appDir);
const classes = new Set();

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/className=["']([^"']+)["']/g);
    if (matches) {
      matches.forEach(match => {
        const classStr = match.match(/["']([^"']+)["']/)[1];
        classStr.split(/\s+/).forEach(c => {
           if (c && !c.includes('{') && !c.includes('`')) {
             classes.add(c);
           }
        });
      });
    }
    // Also match template literals
    const tplMatches = content.match(/className={`([^`]+)`}/g);
    if (tplMatches) {
        tplMatches.forEach(match => {
            const classStr = match.match(/`([^`]+)`/)[1];
            classStr.split(/[\s${}]+/).forEach(c => {
                if (c && !c.startsWith('$') && !c.includes('?') && !c.includes(':')) {
                    classes.add(c);
                }
            });
        });
    }
  }
});

console.log(JSON.stringify(Array.from(classes).sort(), null, 2));
