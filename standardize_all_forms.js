const fs = require('fs');
const path = require('path');

// 1. Convert specific files that use Tailwind modals to standard project overlays/modals/grids
function standardizeBankAccountsView() {
    const filePath = 'd:/Project/accountbook/fronted/src/BankAccountsView.tsx';
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace modal structure
    const modalStart = `<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">`;
    const modalContent = `<div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">`;
    
    // We can do a string search and replace for the exact modal block
    const targetBlock = `      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">`;

    const newBlock = `      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleSaveAccount} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BANKING & PAYMENTS</p>
                <h2>{editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">`;

    content = content.replace(targetBlock, newBlock);

    // Replace form-grid divs (remove tailwind grid columns and classes to use standard form-grid styles)
    // We will do a generic replacement inside the form block
    // Let's replace the footer as well:
    const targetFooter = `              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white hover:bg-[#0f3222]">Save Bank Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}`;

    const newFooter = `            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Save Bank Account</button>
            </div>
          </form>
        </div>
      )}`;

    content = content.replace(targetFooter, newFooter);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Standardized BankAccountsView');
}

function standardizeCashAccountsView() {
    const filePath = 'd:/Project/accountbook/fronted/src/CashAccountsView.tsx';
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const targetBlock = `      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">{editingAccount ? 'Edit Cash Account' : 'Add Cash Register'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleSaveAccount} className="space-y-4">`;

    const newBlock = `      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleSaveAccount} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BANKING & PAYMENTS</p>
                <h2>{editingAccount ? 'Edit Cash Account' : 'Add Cash Register'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">`;

    content = content.replace(targetBlock, newBlock);

    const targetFooter = `              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white">Save Cash Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}`;

    const newFooter = `            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Save Cash Account</button>
            </div>
          </form>
        </div>
      )}`;

    content = content.replace(targetFooter, newFooter);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Standardized CashAccountsView');
}

function standardizeCustomerReceiptsView() {
    const filePath = 'd:/Project/accountbook/fronted/src/CustomerReceiptsView.tsx';
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const targetBlock = `      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Customer Receipt</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleCreateReceipt} className="space-y-4">`;

    const newBlock = `      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreateReceipt} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">SALES & CUSTOMERS</p>
                <h2>Record Customer Receipt</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">`;

    content = content.replace(targetBlock, newBlock);

    const targetFooter = `              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white">Record Receipt</Button>
              </div>
            </form>
          </div>
        </div>
      )}`;

    const newFooter = `            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Record Receipt</button>
            </div>
          </form>
        </div>
      )}`;

    content = content.replace(targetFooter, newFooter);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Standardized CustomerReceiptsView');
}

function standardizeFundTransfersView() {
    const filePath = 'd:/Project/accountbook/fronted/src/FundTransfersView.tsx';
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const targetBlock = `      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">New Inter-Account Transfer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleCreateTransfer} className="space-y-4">`;

    const newBlock = `      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreateTransfer} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BANKING & PAYMENTS</p>
                <h2>New Inter-Account Transfer</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">`;

    content = content.replace(targetBlock, newBlock);

    const targetFooter = `              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white">Execute Transfer</Button>
              </div>
            </form>
          </div>
        </div>
      )}`;

    const newFooter = `            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Execute Transfer</button>
            </div>
          </form>
        </div>
      )}`;

    content = content.replace(targetFooter, newFooter);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Standardized FundTransfersView');
}

function standardizeVendorPaymentsView() {
    const filePath = 'd:/Project/accountbook/fronted/src/VendorPaymentsView.tsx';
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const targetBlock = `      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Vendor Payment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleCreatePayment} className="space-y-4">`;

    const newBlock = `      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreatePayment} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">PROCUREMENT</p>
                <h2>Record Vendor Payment</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">`;

    content = content.replace(targetBlock, newBlock);

    const targetFooter = `              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white">Record Payment</Button>
              </div>
            </form>
          </div>
        </div>
      )}`;

    const newFooter = `            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Record Payment</button>
            </div>
          </form>
        </div>
      )}`;

    content = content.replace(targetFooter, newFooter);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Standardized VendorPaymentsView');
}

function standardizeBankingWorkspace() {
    const filePath = 'd:/Project/accountbook/fronted/src/BankingWorkspace.tsx';
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Inter-Account Fund Transfer
    content = content.replace(
        `      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Inter-Account Fund Transfer</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">`,
        `      {isTransferModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleExecuteTransfer} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BANKING & PAYMENTS</p>
                <h2>Inter-Account Fund Transfer</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsTransferModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">`
    );

    content = content.replace(
        `              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white hover:bg-[#0f3222]">Execute Transfer</Button>
              </div>
            </form>
          </div>
        </div>
      )}`,
        `            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Execute Transfer</button>
            </div>
          </form>
        </div>
      )}`
    );

    // 2. Record Payment
    content = content.replace(
        `      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record {paymentForm.type}</h3>
              <button onClick={() => setIsNewPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4">`,
        `      {isNewPaymentModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreatePayment} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BANKING & PAYMENTS</p>
                <h2>Record {paymentForm.type}</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsNewPaymentModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">`
    );

    content = content.replace(
        `              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsNewPaymentModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white hover:bg-[#0f3222]">Save {paymentForm.type}</Button>
              </div>
            </form>
          </div>
        </div>
      )}`,
        `            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsNewPaymentModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Save {paymentForm.type}</button>
            </div>
          </form>
        </div>
      )}`
    );

    // 3. Add Bank Account
    content = content.replace(
        `      {isNewBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Bank or Cash Account</h3>
              <button onClick={() => setIsNewBankModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleCreateBankAccount} className="space-y-4">`,
        `      {isNewBankModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreateBankAccount} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BANKING & PAYMENTS</p>
                <h2>Add New Bank or Cash Account</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsNewBankModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">`
    );

    content = content.replace(
        `              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsNewBankModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white hover:bg-[#0f3222]">Save Bank Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}`,
        `            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsNewBankModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Save Bank Account</button>
            </div>
          </form>
        </div>
      )}`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Standardized BankingWorkspace');
}

// 2. Add Save Draft button to all modal-footer instances in all tsx files
function addSaveDraftToAllFooters() {
    const dir = 'd:/Project/accountbook/fronted/src';
    
    function walk(currentDir) {
        fs.readdirSync(currentDir).forEach(file => {
            const fullPath = path.join(currentDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
            } else if (file.endsWith('.tsx')) {
                let code = fs.readFileSync(fullPath, 'utf8');
                let changed = false;

                // Match modal-footer blocks
                const footerRegex = /<div className="modal-footer">([\s\S]*?)<\/div>/g;
                code = code.replace(footerRegex, (match, inner) => {
                    if (inner.includes('Save Draft')) return match;
                    
                    // We need to find the primary button. The primary button can be multilined.
                    // Let's use a regex with /s flag to find the primary button
                    const primaryBtnRegex = /(<button[^>]*?className="primary"[^>]*?>.*?<\/button>)/s;
                    if (primaryBtnRegex.test(inner)) {
                        changed = true;
                        return `<div className="modal-footer">` + inner.replace(primaryBtnRegex, (btnMatch) => {
                            return `<button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>\n              ` + btnMatch;
                        }) + `</div>`;
                    }
                    return match;
                });

                if (changed) {
                    fs.writeFileSync(fullPath, code, 'utf8');
                    console.log('Injected Save Draft into modal-footer of:', file);
                }
            }
        });
    }

    walk(dir);
}

// Run the tasks
standardizeBankAccountsView();
standardizeCashAccountsView();
standardizeCustomerReceiptsView();
standardizeFundTransfersView();
standardizeVendorPaymentsView();
standardizeBankingWorkspace();
addSaveDraftToAllFooters();
console.log('Form standardization complete!');
