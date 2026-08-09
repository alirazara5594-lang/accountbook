import React from 'react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  openingBalance: number;
  status: string;
  reconciliationEnabled: boolean;
}

interface Journal {
  id: string;
  description: string;
  reference: string;
  date: string;
  lines: any[];
}

interface ModuleSummaryProps {
  moduleName: string;
  accounts: Account[];
  entries: Journal[];
  setPage: (page: string) => void;
  openCreateAccount: () => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const ModuleSummary: React.FC<ModuleSummaryProps> = ({
  moduleName,
  accounts,
  entries,
  setPage,
  openCreateAccount
}) => {
  
  // Calculate dynamic metrics based on current module
  const getMetrics = () => {
    switch (moduleName) {
      case 'Sales & Customers': {
        const receivables = accounts
          .filter(a => a.code.startsWith('12') || a.name.toLowerCase().includes('receivable'))
          .reduce((s, a) => s + a.openingBalance, 0);
        const revenue = accounts
          .filter(a => a.type === 'Revenue')
          .reduce((s, a) => s + a.openingBalance, 0);
        return {
          card1: { title: 'RECEIVABLES LEDGER', val: formatCurrency(receivables), desc: 'Outstanding balances from customers', icon: '⌁', color: 'teal' },
          card2: { title: 'TOTAL SALES REVENUE', val: formatCurrency(revenue), desc: 'Accrued sales and customer billing', icon: '⌘', color: 'blue' },
          card3: { title: 'ACTIVE CUSTOMERS', val: '3', desc: 'Approved customer profile records', icon: '👥', color: 'violet' }
        };
      }
      case 'Procurement': {
        const payables = accounts
          .filter(a => a.code.startsWith('21') || a.name.toLowerCase().includes('payable'))
          .reduce((s, a) => s + a.openingBalance, 0);
        const grni = accounts
          .filter(a => a.code === '22000')
          .reduce((s, a) => s + a.openingBalance, 0);
        return {
          card1: { title: 'PAYABLES LEDGER', val: formatCurrency(payables), desc: 'Outstanding balance due to suppliers', icon: '⌁', color: 'violet' },
          card2: { title: 'GRNI ACCRUALS', val: formatCurrency(grni), desc: 'Goods Received Not Invoiced accruals', icon: '⚙', color: 'blue' },
          card3: { title: 'TOTAL VENDORS', val: '2', desc: 'Approved vendor profile records', icon: '👥', color: 'teal' }
        };
      }
      case 'Banking & Payments': {
        const liquid = accounts
          .filter(a => a.code.startsWith('11') || a.reconciliationEnabled)
          .reduce((s, a) => s + a.openingBalance, 0);
        const count = accounts.filter(a => a.reconciliationEnabled && a.status === 'Active').length;
        const totalEntries = entries.filter(e => e.description.toLowerCase().includes('bank') || e.description.toLowerCase().includes('cash')).length;
        return {
          card1: { title: 'CASH & EQUIVALENTS', val: formatCurrency(liquid), desc: 'Total liquid bank & cash balances', icon: '⌁', color: 'teal' },
          card2: { title: 'RECONCILED ACCOUNTS', val: String(count), desc: 'Active bank accounts with audit enabled', icon: '🏛', color: 'blue' },
          card3: { title: 'BANK JOURNAL ACTIVITY', val: String(totalEntries), desc: 'Bank postings in active period', icon: '⇄', color: 'violet' }
        };
      }
      case 'Accounting': {
        const assetsCount = accounts.filter(a => a.type === 'Asset').length;
        const liabilitiesCount = accounts.filter(a => a.type === 'Liability').length;
        const equityCount = accounts.filter(a => a.type === 'Equity').length;
        return {
          card1: { title: 'ASSET LEDGER CODES', val: String(assetsCount), desc: 'Active asset account classifications', icon: '⌘', color: 'teal' },
          card2: { title: 'LIABILITY LEDGER CODES', val: String(liabilitiesCount), desc: 'Active liability account classifications', icon: '⚙', color: 'blue' },
          card3: { title: 'EQUITY LEDGER CODES', val: String(equityCount), desc: 'Active equity and reserve accounts', icon: '🏛', color: 'violet' }
        };
      }
      case 'Assets & Inventory': {
        const ppe = accounts
          .filter(a => a.code.startsWith('151') || a.name.toLowerCase().includes('equipment') || a.name.toLowerCase().includes('property'))
          .reduce((s, a) => s + a.openingBalance, 0);
        const inventory = accounts
          .filter(a => a.code === '13000' || a.name.toLowerCase().includes('inventory'))
          .reduce((s, a) => s + a.openingBalance, 0);
        const depreciation = accounts
          .filter(a => a.code === '15200' || a.name.toLowerCase().includes('depreciation'))
          .reduce((s, a) => s + a.openingBalance, 0);
        return {
          card1: { title: 'FIXED ASSETS (PPE)', val: formatCurrency(ppe), desc: 'Net book value of fixed assets', icon: '🏛', color: 'teal' },
          card2: { title: 'INVENTORY VALUE', val: formatCurrency(inventory), desc: 'Valued balance of physical stock', icon: '📦', color: 'blue' },
          card3: { title: 'ACCUMULATED DEPRECIATION', val: formatCurrency(depreciation), desc: 'Accrued write-downs under IAS 16', icon: '⌁', color: 'violet' }
        };
      }
      default: {
        return {
          card1: { title: 'ACTIVE MODULE', val: moduleName, desc: 'Selected system operational area', icon: '⌘', color: 'blue' },
          card2: { title: 'METRIC MONITOR', val: 'Operational', desc: 'Status checks are active and running', icon: '⚙', color: 'teal' },
          card3: { title: 'GL POSTINGS', val: String(entries.length), desc: 'System journal entries recorded', icon: '⇄', color: 'violet' }
        };
      }
    }
  };

  const metrics = getMetrics();

  const renderWorkflows = () => {
    switch (moduleName) {
      case 'Sales & Customers':
        return (
          <>
            <button onClick={() => setPage('Sales & Customers.Customers')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Add New Customer</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Register customer contact details, tax identification numbers, and credit terms.</p>
            </button>
            <button onClick={() => setPage('Sales & Customers.Sales Workspace')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Sales Invoicing & Ledger</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Issue billing statements, record local VAT/sales tax, and trace balances due.</p>
            </button>
          </>
        );
      case 'Procurement':
        return (
          <>
            <button onClick={() => setPage('Procurement.Vendors')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Add New Vendor</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Register supplier credentials, base billing currencies, and payment terms.</p>
            </button>
            <button onClick={() => setPage('Procurement.Procurement Workspace')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Procurement Workspace</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Generate Purchase Orders, post Goods Receipt Notes (GRN), and verify vendor invoices.</p>
            </button>
          </>
        );
      case 'Banking & Payments':
        return (
          <>
            <button onClick={() => setPage('Accounting.Journal Entries')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Record Bank Transaction</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Record bank deposits, external transfers, or cash receipts and disbursements.</p>
            </button>
            <button onClick={() => setPage('Accounting.Financial Reports')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Cash Flow Statements</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Inspect the Statement of Cash Flows matching cash movements to core activities.</p>
            </button>
          </>
        );
      case 'Accounting':
        return (
          <>
            <button onClick={openCreateAccount} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>New Account Code</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Add new accounts using standard 5-digit sequences under appropriate subgroups.</p>
            </button>
            <button onClick={() => setPage('Accounting.Journal Entries')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>New Journal Entry</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Post custom double-entry General Ledger transactions with balanced debits and credits.</p>
            </button>
            <button onClick={() => setPage('Accounting.Financial Reports')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Financial Reporting</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Verify compliance reporting including Balance Sheets and Profit & Loss reports.</p>
            </button>
          </>
        );
      case 'Assets & Inventory':
        return (
          <>
            <button onClick={() => setPage('Assets & Inventory.Assets & Inventory Workspace')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Inventory Workspace</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Manage physical warehousing locations, calculate values, and post adjustments.</p>
            </button>
            <button onClick={() => setPage('Accounting.Fixed Assets')} className="nav" style={{ padding: '12px', border: '1px solid #e3e8ef', borderRadius: '8px', background: '#fff', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
              <strong>Fixed Asset Register</strong>
              <p style={{ fontSize: '11px', color: '#8d9aad', marginTop: '4px' }}>Record assets, trigger depreciation schedules, and manage disposal entries.</p>
            </button>
          </>
        );
      default:
        return (
          <div className="empty" style={{ padding: '20px 0', textAlign: 'center' }}>
            No specific actions configured for this module. Use the sub-menus in the sidebar to navigate.
          </div>
        );
    }
  };

  const getSubList = () => {
    switch (moduleName) {
      case 'Sales & Customers':
        return ['Customers', 'Products & Services', 'Sales Workspace', 'Estimates & Quotes', 'Sales Reports'];
      case 'Procurement':
        return ['Vendors', 'Procurement Workspace', 'Bills', 'Expense Claims', 'Purchase Reports'];
      case 'Banking & Payments':
        return ['Bank Accounts', 'Cash Accounts', 'Transactions', 'Bank Reconciliation', 'Cash Flow'];
      case 'Accounting':
        return ['Chart of Accounts', 'Journal Entries', 'Fixed Assets', 'General Ledger', 'Financial Reports'];
      case 'Assets & Inventory':
        return ['Depreciation Schedule', 'Valuation Reports'];
      default:
        return [];
    }
  };

  const subItems = getSubList();

  return (
    <div style={{ height: 'calc(100vh - 170px)', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
      {/* Metrics Row (Unified with Dashboard theme) */}
      <section className="stats" style={{ marginBottom: 0 }}>
        <article>
          <span className={`stat-icon ${metrics.card1.color}`}>{metrics.card1.icon}</span>
          <div>
            <small>{metrics.card1.title}</small>
            <h2>{metrics.card1.val}</h2>
            <p>{metrics.card1.desc}</p>
          </div>
        </article>
        <article>
          <span className={`stat-icon ${metrics.card2.color}`}>{metrics.card2.icon}</span>
          <div>
            <small>{metrics.card2.title}</small>
            <h2>{metrics.card2.val}</h2>
            <p>{metrics.card2.desc}</p>
          </div>
        </article>
        <article>
          <span className={`stat-icon ${metrics.card3.color}`}>{metrics.card3.icon}</span>
          <div>
            <small>{metrics.card3.title}</small>
            <h2>{metrics.card3.val}</h2>
            <p>{metrics.card3.desc}</p>
          </div>
        </article>
      </section>

      {/* Details Row (Compact and fitted on page) */}
      <section className="grid" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Hand: Workflows */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', overflowY: 'auto' }}>
          <div className="panel-head" style={{ marginBottom: '5px' }}>
            <div>
              <h3>Workflows & Actions</h3>
              <p>Quick shortcuts to manage this module</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {renderWorkflows()}
          </div>
        </div>

        {/* Right Hand: Submenu list */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          <div className="panel-head" style={{ marginBottom: '10px' }}>
            <div>
              <h3>Available Sub-sections</h3>
              <p>Direct navigation list</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {subItems.map(item => (
              <button
                key={item}
                onClick={() => setPage(`${moduleName}.${item}`)}
                className="nav"
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #edf0f4',
                  background: '#f8fafc',
                  color: '#2d3748',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  margin: '2px 0'
                }}
              >
                <span>• {item}</span>
                <span style={{ color: '#176f76' }}>View →</span>
              </button>
            ))}
            {subItems.length === 0 && (
              <div className="empty" style={{ padding: '20px 0', textAlign: 'center' }}>
                Navigate using the sidebar menu items.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
