const fs = require('fs');
const path = require('path');

const dir = 'd:/Project/accountbook/fronted/src';

function walk(currentDir) {
    fs.readdirSync(currentDir).forEach(file => {
        const fullPath = path.join(currentDir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.tsx')) {
            let code = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // Replace <form className="modal" ... style={{ width: 'min(700px, 100%)' }}> with just <form className="modal" ...>
            // Replace <form className="modal" ... style={{ width: 'min(800px, 100%)' }}> with just <form className="modal" ...>
            // Handle both single/double quotes, and spaces.
            
            const regexes = [
                /style=\{\{\s*width:\s*['"]min\((?:700|800)px,\s*100%\)['"]\s*\}\}/g,
                /style=\{\{\s*width:\s*`min\((?:700|800)px,\s*100%\)`\s*\}\}/g
            ];

            for (let regex of regexes) {
                if (regex.test(code)) {
                    code = code.replace(regex, '');
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(fullPath, code, 'utf8');
                console.log('Removed inline modal width style from:', file);
            }
        }
    });
}

walk(dir);
console.log('Finished removing inline widths.');
