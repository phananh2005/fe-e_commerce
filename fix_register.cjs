const fs = require('fs');
let c = fs.readFileSync('src/pages/shared/RegisterPage.tsx', 'utf8');
c = c.replace(/['"]info['"]/g, '"success"');
fs.writeFileSync('src/pages/shared/RegisterPage.tsx', c);
