const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  path.join(__dirname, 'app/components/CreateTemplateModal.tsx'),
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Any remaining COLORS.
    content = content.replace(/COLORS\.primaryPale/g, '"var(--color-primary-pale)"');
    content = content.replace(/COLORS\.primarySoft/g, '"var(--color-primary-soft)"');
    content = content.replace(/COLORS\.primaryHover/g, '"var(--color-primary-hover)"');
    content = content.replace(/COLORS\.primary/g, '"var(--color-primary)"');
    content = content.replace(/COLORS\.surface/g, '"var(--color-surface)"');
    content = content.replace(/COLORS\.panel/g, '"var(--color-panel)"');
    content = content.replace(/COLORS\.text/g, '"var(--color-foreground)"');
    content = content.replace(/COLORS\.bg/g, '"var(--color-background)"');
    content = content.replace(/COLORS\.mutedDark/g, '"var(--color-muted-dark)"');
    content = content.replace(/COLORS\.muted/g, '"var(--color-muted)"');
    content = content.replace(/COLORS\.dangerSoft/g, '"var(--color-danger-soft)"');
    content = content.replace(/COLORS\.danger/g, '"var(--color-danger)"');
    content = content.replace(/COLORS\.borderSoft/g, '"var(--color-border-soft)"');
    content = content.replace(/COLORS\.border/g, '"var(--color-border)"');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
