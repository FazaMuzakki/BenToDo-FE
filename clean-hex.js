const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'app/dashboard'),
  path.join(__dirname, 'app/admin'),
  path.join(__dirname, 'app/components'),
  path.join(__dirname, 'app/focus'),
];

function cleanHexInFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  const replacements = [
    { regex: /"#111827"/gi, replace: '"var(--color-foreground)"' },
    { regex: /"#4b5563"/gi, replace: '"var(--color-muted)"' },
    { regex: /"#6b7280"/gi, replace: '"var(--color-muted-dark)"' },
    { regex: /"#9ca3af"/gi, replace: '"var(--color-muted-dark)"' },
    { regex: /"#f3f4f6"/gi, replace: '"var(--color-panel)"' },
    { regex: /"#f9fafb"/gi, replace: '"var(--color-surface)"' },
    { regex: /"#fafafa"/gi, replace: '"var(--color-surface)"' },
    { regex: /"#ffffff"/gi, replace: '"var(--color-surface)"' },
    { regex: /"#e5e7eb"/gi, replace: '"var(--color-border)"' },
    { regex: /"#f0f0f0"/gi, replace: '"var(--color-border-soft)"' },
    { regex: /"#3b82f6"/gi, replace: '"var(--color-primary)"' },
    { regex: /"#eff6ff"/gi, replace: '"var(--color-primary-pale)"' },
    { regex: /"#166534"/gi, replace: '"var(--color-primary)"' },
    { regex: /"#14532d"/gi, replace: '"var(--color-primary-hover)"' },
    { regex: /"#DC2626"/gi, replace: '"var(--color-danger)"' },
    { regex: /"#b91c1c"/gi, replace: '"var(--color-danger)"' },
    { regex: /"#FEE2E2"/gi, replace: '"var(--color-danger-soft)"' },
    { regex: /"#fee2e2"/gi, replace: '"var(--color-danger-soft)"' },
  ];

  let modified = false;
  replacements.forEach(({ regex, replace }) => {
    if (regex.test(content)) {
      modified = true;
      content = content.replace(regex, replace);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned hex codes in ${filePath}`);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else {
      cleanHexInFile(fullPath);
    }
  });
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
});
