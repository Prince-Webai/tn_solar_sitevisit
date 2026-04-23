const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\princ\\Downloads\\Tn solar SIte Visit\\Site_Visit';
const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build', '.temp'];

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(/TN Solar/g, 'TN Solar');
  newContent = newContent.replace(/TN Solar/g, 'TN Solar');
  newContent = newContent.replace(/tnsolar/g, 'tnsolar');
  newContent = newContent.replace(/TN-/g, 'TN-');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        walkDir(filePath);
      }
    } else {
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.md', '.html', '.css'].some(ext => file.endsWith(ext))) {
        replaceInFile(filePath);
      }
    }
  }
}

walkDir(rootDir);
console.log('Rebranding complete!');
