const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('d:/Project/accountbook/fronted/src', function(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Standardize modal-footer
    const footerRegex = /<div className="modal-footer">([\s\S]*?)<\/div>/g;
    content = content.replace(footerRegex, (match, inner) => {
        if (inner.includes('Save Draft')) return match;
        changed = true;
        
        let newInner = inner.replace(/<button (.*?)className="primary"(.*?)>(.*?)<\/button>/, 
            '<button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>\n<button $1className="primary"$2>$3</button>');
            
        return `<div className="modal-footer">${newInner}</div>`;
    });

    // Handle App.tsx specific entry-footer
    if (filePath.endsWith('App.tsx') && !content.includes('>Save Draft</button>')) {
      const entryFooterRegex = /<button className="primary" disabled={totals\.debit !== totals\.credit}>Post entry<\/button>/g;
      if (entryFooterRegex.test(content)) {
          changed = true;
          content = content.replace(/<button className="primary" disabled={totals\.debit !== totals\.credit}>Post entry<\/button>/g, `<div style={{ display: 'flex', gap: '8px' }}>
    <button type="button" className="secondary" disabled={totals.debit !== totals.credit} onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
    <button className="primary" disabled={totals.debit !== totals.credit}>Post entry</button>
  </div>`);
      }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
});
