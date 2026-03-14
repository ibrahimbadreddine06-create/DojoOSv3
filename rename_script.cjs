const fs = require('fs');
const path = require('path');

const DIRS_TO_SCAN = ['client', 'server'];
const FILES_TO_SCAN = ['package.json', 'package-lock.json', 'replit.md', 'dojo_os_ai_context.md', 'design_guidelines.md'];

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/Dojo OS V2/g, 'DojoOS')
      .replace(/Dojo OS/g, 'DojoOS')
      .replace(/"name": "rest-express"/g, '"name": "DojoOS"')
      .replace(/"rest-express"/g, '"DojoOS"')
      .replace(/DojoOSbehavior/gi, 'DojoOS');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated:', filePath);
    }
  } catch (e) {
    // ignore
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.gemini'].includes(entry.name)) continue;
      scanDir(fullPath);
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.json') || fullPath.endsWith('.md') || fullPath.endsWith('.html')) {
        processFile(fullPath);
      }
    }
  }
}

for (const file of FILES_TO_SCAN) {
  processFile(path.join(process.cwd(), file));
}
for (const dir of DIRS_TO_SCAN) {
  scanDir(path.join(process.cwd(), dir));
}

// Check index.html
processFile(path.join(process.cwd(), 'client', 'index.html'));

console.log('Renaming complete.');
