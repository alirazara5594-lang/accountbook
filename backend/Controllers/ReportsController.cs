using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/reports")]
public class ReportsController(AccountingStore store) : ControllerBase
{
    private static bool IsRevenue(AccountType t) => t is AccountType.Revenue or AccountType.ContraRevenue;
    private static bool IsExpense(AccountType t) => t is AccountType.Expense or AccountType.ContraExpense;
    private static bool IsAsset(AccountType t) => t is AccountType.Asset or AccountType.ContraAsset;
    private static bool IsLiability(AccountType t) => t is AccountType.Liability or AccountType.ContraLiability;
    private static bool IsEquity(AccountType t) => t is AccountType.Equity or AccountType.ContraEquity;

    private static IEnumerable<Account> PostingAccounts(AccountingStore store) =>
        store.Accounts.Where(a => a.IsPosting && a.Status == AccountStatus.Active);

    private static IEnumerable<JournalEntry> PostedEntries(AccountingStore store, Guid? companyId, string? from, string? to)
    {
        var query = store.Entries.Where(e => e.Status == JournalStatus.Posted);
        if (companyId.HasValue) query = query.Where(e => e.CompanyId == companyId);
        if (DateOnly.TryParse(from, out var fromDate)) query = query.Where(e => e.Date >= fromDate);
        if (DateOnly.TryParse(to, out var toDate)) query = query.Where(e => e.Date <= toDate);
        return query;
    }

    private static Dictionary<Guid, decimal> AccountBalances(AccountingStore store, Guid? companyId, string? from, string? to)
    {
        var balances = new Dictionary<Guid, decimal>();
        foreach (var account in PostingAccounts(store)) balances[account.Id] = account.OpeningBalance;
        foreach (var line in PostedEntries(store, companyId, from, to).SelectMany(e => e.Lines))
        {
            if (!balances.TryGetValue(line.AccountId, out var current)) continue;
            balances[line.AccountId] = current + line.Debit - line.Credit;
        }
        return balances;
    }

    [HttpGet("trial-balance")]
    public IActionResult TrialBalance([FromQuery] Guid? companyId, [FromQuery] string? from, [FromQuery] string? to)
    {
        var balances = AccountBalances(store, companyId, from, to);
        var rows = PostingAccounts(store).Select(a =>
        {
            var bal = balances.GetValueOrDefault(a.Id);
            var (debit, credit) = a.NormalBalance == NormalBalanceType.Debit
                ? (bal > 0 ? bal : 0m, bal < 0 ? -bal : 0m)
                : (bal < 0 ? -bal : 0m, bal > 0 ? bal : 0m);
            return new { a.Id, a.Code, a.Name, a.Type, Debit = debit, Credit = credit, Balance = bal };
        }).Where(r => r.Balance != 0).OrderBy(r => r.Code).ToList();
        return Ok(new { totalDebit = rows.Sum(r => r.Debit), totalCredit = rows.Sum(r => r.Credit), rows });
    }

    [HttpGet("income-statement")]
    public IActionResult IncomeStatement([FromQuery] Guid? companyId, [FromQuery] string? from, [FromQuery] string? to)
    {
        var balances = AccountBalances(store, companyId, from, to);
        var rows = PostingAccounts(store)
            .Where(a => IsRevenue(a.Type) || IsExpense(a.Type))
            .Select(a => new { a.Id, a.Code, a.Name, a.Type, Amount = balances.GetValueOrDefault(a.Id) })
            .Where(r => r.Amount != 0)
            .OrderBy(r => r.Code).ToList();

        var revenue = rows.Where(r => IsRevenue(r.Type)).Sum(r => r.Amount);
        var expenses = rows.Where(r => IsExpense(r.Type)).Sum(r => r.Amount);
        var netIncome = revenue - expenses;
        return Ok(new { revenue, expenses, netIncome, rows });
    }

    [HttpGet("balance-sheet")]
    public IActionResult BalanceSheet([FromQuery] Guid? companyId, [FromQuery] string? from, [FromQuery] string? to)
    {
        var balances = AccountBalances(store, companyId, from, to);
        var rows = PostingAccounts(store)
            .Where(a => IsAsset(a.Type) || IsLiability(a.Type) || IsEquity(a.Type))
            .Select(a => new { a.Id, a.Code, a.Name, a.Type, Amount = balances.GetValueOrDefault(a.Id) })
            .Where(r => r.Amount != 0)
            .OrderBy(r => r.Code).ToList();

        var assets = rows.Where(r => IsAsset(r.Type)).Sum(r => r.Amount);
        var liabilities = rows.Where(r => IsLiability(r.Type)).Sum(r => r.Amount);
        var equity = rows.Where(r => IsEquity(r.Type)).Sum(r => r.Amount);
        return Ok(new { assets, liabilities, equity, total = assets, rows });
    }

    [HttpGet("cash-flow")]
    public IActionResult CashFlow([FromQuery] Guid? companyId, [FromQuery] string? from, [FromQuery] string? to)
    {
        var balances = AccountBalances(store, companyId, from, to);
        var rows = PostingAccounts(store)
            .Where(a => IsRevenue(a.Type) || IsExpense(a.Type))
            .Select(a => new { a.Id, a.Code, a.Name, a.Type, Amount = balances.GetValueOrDefault(a.Id) })
            .Where(r => r.Amount != 0).ToList();
        var revenue = rows.Where(r => IsRevenue(r.Type)).Sum(r => r.Amount);
        var expenses = rows.Where(r => IsExpense(r.Type)).Sum(r => r.Amount);
        var netIncome = revenue - expenses;
        return Ok(new { netIncome, operatingCashFlow = netIncome, investingCashFlow = 0m, financingCashFlow = 0m, netCashFlow = netIncome, rows });
    }

    [HttpGet("general-ledger")]
    public IActionResult GeneralLedger([FromQuery] Guid? companyId, [FromQuery] string? from, [FromQuery] string? to, [FromQuery] Guid? accountId)
    {
        var accounts = PostingAccounts(store).ToDictionary(a => a.Id);
        var lines = PostedEntries(store, companyId, from, to)
            .SelectMany(e => e.Lines.Select(l => new
            {
                e.Id,
                e.Date,
                e.Reference,
                e.Description,
                e.Status,
                e.TransactionType,
                AccountId = l.AccountId,
                AccountCode = accounts.TryGetValue(l.AccountId, out var a) ? a.Code : "",
                AccountName = accounts.TryGetValue(l.AccountId, out var a2) ? a2.Name : "",
                l.Debit,
                l.Credit,
                l.Memo
            }))
            .Where(l => !accountId.HasValue || l.AccountId == accountId)
            .OrderBy(l => l.Date)
            .ToList();
        return Ok(lines);
    }

    [HttpGet("ar-ledger")]
    public IActionResult ArLedger([FromQuery] Guid? companyId, [FromQuery] Guid? customerId)
    {
        var arId = store.GetMappedAccount("Customer Receivables");
        var invoices = store.SalesInvoices
            .Where(i => companyId == null || i.CompanyId == companyId)
            .Where(i => customerId == null || i.CustomerId == customerId.Value)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.CustomerId,
                CustomerName = store.Customers.FirstOrDefault(c => c.Id == i.CustomerId)?.Name ?? "Unknown",
                Date = i.InvoiceDate.ToString("yyyy-MM-dd"),
                DueDate = i.DueDate.ToString("yyyy-MM-dd"),
                i.TotalAmount,
                i.AmountPaid,
                i.AmountDue,
                Status = i.Status.ToString(),
                Currency = "USD"
            })
            .OrderBy(i => i.DueDate).ToList();

        var current = invoices.Where(i => i.AmountDue > 0 && (DateTime.Parse(i.DueDate) - DateTime.Today).Days >= 0).Sum(i => i.AmountDue);
        var pastDue = invoices.Where(i => i.AmountDue > 0 && (DateTime.Parse(i.DueDate) - DateTime.Today).Days < 0).Sum(i => i.AmountDue);
        return Ok(new { arAccountId = arId, current, pastDue, totalDue = current + pastDue, invoices });
    }

    [HttpGet("ap-ledger")]
    public IActionResult ApLedger([FromQuery] Guid? companyId, [FromQuery] Guid? vendorId)
    {
        var apId = store.GetMappedAccount("Vendor Payables");
        var bills = store.VendorBills
            .Where(b => companyId == null || b.CompanyId == companyId)
            .Where(b => vendorId == null || b.VendorId == vendorId.Value)
            .Where(b => b.Status == VendorBillStatus.Open || b.Status == VendorBillStatus.PartiallyPaid)
            .Select(b => new
            {
                b.Id,
                b.BillNumber,
                b.VendorId,
                VendorName = store.Vendors.FirstOrDefault(v => v.Id == b.VendorId)?.Name ?? "Unknown",
                Date = b.Date.ToString("yyyy-MM-dd"),
                DueDate = b.DueDate.ToString("yyyy-MM-dd"),
                b.TotalAmount,
                b.AmountPaid,
                b.AmountDue,
                Status = b.Status.ToString(),
                b.CurrencyCode
            })
            .OrderBy(b => b.DueDate).ToList();

        var current = bills.Where(b => b.AmountDue > 0 && (DateTime.Parse(b.DueDate) - DateTime.Today).Days >= 0).Sum(b => b.AmountDue);
        var pastDue = bills.Where(b => b.AmountDue > 0 && (DateTime.Parse(b.DueDate) - DateTime.Today).Days < 0).Sum(b => b.AmountDue);
        return Ok(new { apAccountId = apId, current, pastDue, totalDue = current + pastDue, bills });
    }
}