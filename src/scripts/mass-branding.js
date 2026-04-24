
const fs = require('fs');
const path = require('path');

const rootDir = 'src';

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

const files = getAllFiles(rootDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace colors
  if (content.includes('vision-green')) {
    content = content.replace(/vision-green/g, 'primary');
    changed = true;
  }
  if (content.includes('green-dark')) {
    content = content.replace(/green-dark/g, 'primary-dark');
    changed = true;
  }
  if (content.includes('solar-orange')) {
    content = content.replace(/solar-orange/g, 'secondary');
    changed = true;
  }
  if (content.includes('orange-dark')) {
    content = content.replace(/orange-dark/g, 'secondary-dark');
    changed = true;
  }

  // Replace emails
  if (content.includes('@visionsolar.com')) {
    content = content.replace(/@visionsolar.com/g, '@tnsolar.com');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
