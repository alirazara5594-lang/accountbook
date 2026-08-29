import { useSalesStore } from '../stores/useSalesStore';

export function getGlobalNextInvoiceNumber(): string {
  let maxNum = 0;

  try {
    const storeInvoices = useSalesStore.getState().invoices || [];
    for (const inv of storeInvoices) {
      const str = (inv.invoiceNumber || inv.reference || '') + '';
      if (str.startsWith('INV-202') || str.length > 10) continue;
      const match = str.match(/INV-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num < 100000 && num > maxNum) {
          maxNum = num;
        }
      }
    }
  } catch {}

  try {
    const localInvoices = JSON.parse(localStorage.getItem('ams_local_invoices_list') || '[]');
    for (const inv of localInvoices) {
      const str = (inv.invoiceNumber || inv.reference || '') + '';
      if (str.startsWith('INV-202') || str.length > 10) continue;
      const match = str.match(/INV-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num < 100000 && num > maxNum) {
          maxNum = num;
        }
      }
    }
  } catch {}

  try {
    const tracked = parseInt(localStorage.getItem('ams_last_used_inv_sequence') || '0', 10);
    if (!isNaN(tracked) && tracked < 100000 && tracked > maxNum) {
      maxNum = tracked;
    }
  } catch {}

  const nextNum = maxNum + 1;
  return `INV-${nextNum.toString().padStart(5, '0')}`;
}

export function recordUsedInvoiceNumber(invNum: string) {
  if (!invNum) return;
  const match = String(invNum).match(/INV-(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num < 100000) {
      const current = parseInt(localStorage.getItem('ams_last_used_inv_sequence') || '0', 10);
      if (num > current) {
        localStorage.setItem('ams_last_used_inv_sequence', String(num));
      }
    }
  }
}
