const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (fs.existsSync('index.html')) {
  fs.copyFileSync('index.html', path.join(publicDir, 'index.html'));
}

if (fs.existsSync('css')) copyFolderSync('css', path.join(publicDir, 'css'));
if (fs.existsSync('js')) copyFolderSync('js', path.join(publicDir, 'js'));

console.log('✅ Public directory generated successfully with all assets!');
