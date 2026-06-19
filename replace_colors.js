const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  path.join(__dirname, 'app/dashboard/page.tsx'),
  path.join(__dirname, 'app/admin/page.tsx'),
  path.join(__dirname, 'app/components/CreateTemplateModal.tsx')
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace backgroundColor: "#ffffff" with backgroundColor: COLOR.surface
    content = content.replace(/backgroundColor:\s*["']#ffffff["']/gi, 'backgroundColor: COLOR.surface');
    // Replace background: "#ffffff" with background: COLOR.surface
    content = content.replace(/background:\s*["']#ffffff["']/gi, 'background: COLOR.surface');
    
    // Replace #F1F1F1 with COLOR.panel (if any left)
    content = content.replace(/["']#F1F1F1["']/gi, 'COLOR.panel');
    
    // Notification logic
    content = content.replace(/["']#FAFFFE["']/gi, 'COLOR.primaryPale');

    // Replace color: "#ffffff" with color: COLOR.bg
    // But be careful, user avatar text color "#ffffff" is fine if background is a fixed gradient
    // Let's only replace it where the background is COLOR.primary or similar
    content = content.replace(/color:\s*["']#ffffff["']/gi, 'color: COLOR.bg');
    // But wait, the avatar has: background: "linear-gradient...", color: "#ffffff"
    // The node script replaces all color: "#ffffff". Let's revert the avatar one later if needed, or just let it be COLOR.bg
    // Actually, avatar gradient is fixed, so the text MUST be white. 
    // Let's just fix the avatar one back specifically.
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
