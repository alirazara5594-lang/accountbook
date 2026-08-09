using Zenabook.Api.Models;
using Zenabook.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Zenabook.Api.Services;

public class AccountingStore
{
    private readonly List<Account> _accounts = [];
    private readonly List<JournalEntry> _entries = [];
    private readonly List<JournalTemplate> _templates = [];
    private readonly List<RecurringJournalEntry> _recurringEntries = [];
    private readonly List<JournalEvent> _journalEvents = [];
    private readonly List<IntercompanyAllocation> _intercompanyAllocations = [];
    private readonly List<Company> _companies = [];
    private readonly List<Customer> _customers = [];
    private readonly List<Product> _products = [];
    private readonly List<Vendor> _vendors = [];
    private readonly List<PurchaseOrder> _purchaseOrders = [];
    private readonly List<GoodsReceiptNote> _grns = [];
    private readonly List<PurchaseRequest> _prs = [];
    private readonly List<RequestForQuotation> _rfqs = [];
    private readonly List<VendorQuote> _vendorQuotes = [];
    private readonly List<VendorBill> _vendorBills = [];
    private readonly List<FixedAsset> _fixedAssets = [];
    private readonly List<Warehouse> _warehouses = [];
    private readonly List<StockLevel> _stockLevels = [];
    private readonly List<StockTransaction> _stockTransactions = [];
    private readonly List<TaxAuthority> _taxAuthorities = [];
    private readonly List<TaxCode> _taxCodes = [];
    private readonly List<TaxRate> _taxRates = [];
    private readonly List<SalesInvoice> _salesInvoices = [];
    private readonly List<Estimate> _estimates = [];
    private readonly Dictionary<Guid, List<AuditItem>> _history = [];
    private readonly object _lock = new();

    private readonly IDbContextFactory<AccountingDbContext>? _dbFactory;
    private sealed record StoredState(
        List<Account> Accounts, 
        List<JournalEntry> Entries, 
        Dictionary<Guid, List<AuditItem>> History, 
        List<JournalTemplate> Templates, 
        List<RecurringJournalEntry> RecurringEntries, 
        List<JournalEvent> Events, 
        List<IntercompanyAllocation>? IntercompanyAllocations = null, 
        List<Company>? Companies = null, 
        List<Customer>? Customers = null, 
        List<Product>? Products = null, 
        List<Vendor>? Vendors = null,
        List<PurchaseOrder>? PurchaseOrders = null,
        List<GoodsReceiptNote>? Grns = null,
        List<FixedAsset>? FixedAssets = null,
        List<TaxAuthority>? TaxAuthorities = null,
        List<TaxCode>? TaxCodes = null,
        List<TaxRate>? TaxRates = null,
        List<Warehouse>? Warehouses = null,
        List<StockLevel>? StockLevels = null,
        List<StockTransaction>? StockTransactions = null,
        List<SalesInvoice>? SalesInvoices = null,
        List<Estimate>? Estimates = null);

    public AccountingStore(IDbContextFactory<AccountingDbContext>? dbFactory = null)
    {
        _dbFactory = dbFactory;
        if (LoadState()) return;
        var parentEntity = new Company { Name = "Acme Holdings", Code = "ACME", Type = EntityType.Parent };
        _companies.AddRange([parentEntity, new Company { Name = "Acme Services", Code = "ASV", ParentId = parentEntity.Id }, new Company { Name = "Acme Trading", Code = "ATD", ParentId = parentEntity.Id }]);
        _customers.AddRange([
            new Customer { CustomerNumber = "CUST-0001", Name = "Global Tech Ltd", Email = "billing@globaltech.com", Phone = "+1 (555) 234-5678", TaxId = "US-987654321", AddressLine1 = "100 Innovation Way", City = "San Francisco", State = "CA", PostalCode = "94105", Country = "United States", CurrencyCode = "USD", CreditLimit = 50000m, PaymentTermsDays = 30, CompanyId = parentEntity.Id },
            new Customer { CustomerNumber = "CUST-0002", Name = "Apex Retail Solutions", Email = "accounts@apexretail.com", Phone = "+1 (555) 876-5432", TaxId = "US-123456789", AddressLine1 = "450 Market Street", City = "New York", State = "NY", PostalCode = "10001", Country = "United States", CurrencyCode = "USD", CreditLimit = 25000m, PaymentTermsDays = 15 }
        ]);
        
        _products.AddRange([
            new Product { Code = "ITEM-0001", Name = "Consulting Hour", Description = "Senior IT Consulting", Type = ProductType.Service, Category = "Professional Services", Unit = "Hour", UnitPrice = 150m, CostPrice = 50m, TaxCodeId = null },
            new Product { Code = "ITEM-0002", Name = "Office Laptop", Description = "High performance laptop", Type = ProductType.Physical, Category = "Hardware", Unit = "Each", UnitPrice = 1200m, CostPrice = 900m, TaxCodeId = null }
        ]);

        _vendors.AddRange([
            new Vendor { VendorNumber = "VEND-0001", Name = "Office Supplies Co", Email = "orders@officesupplies.com", Phone = "+1 (555) 111-2222", TaxId = "US-111111111", City = "Chicago", State = "IL", Country = "United States", CurrencyCode = "USD", PaymentTermsDays = 30 },
            new Vendor { VendorNumber = "VEND-0002", Name = "Cloud Services Inc", Email = "billing@cloudservices.com", Phone = "+1 (555) 333-4444", TaxId = "US-222222222", City = "Seattle", State = "WA", Country = "United States", CurrencyCode = "USD", PaymentTermsDays = 15 }
        ]);

        SeedAccounts();

        // Seed Tax Authorities
        var hmrc = new TaxAuthority { Name = "HMRC", Country = "United Kingdom" };
        var irs = new TaxAuthority { Name = "IRS", Country = "United States" };
        var cdtfa = new TaxAuthority { Name = "CDTFA", Country = "United States", State = "California" };
        var fta = new TaxAuthority { Name = "FTA", Country = "United Arab Emirates" };
        var zatca = new TaxAuthority { Name = "ZATCA", Country = "Saudi Arabia" };
        var fbr = new TaxAuthority { Name = "FBR", Country = "Pakistan" };
        var pra = new TaxAuthority { Name = "PRA", Country = "Pakistan", State = "Punjab" };
        var cra = new TaxAuthority { Name = "CRA", Country = "Canada" };
        
        _taxAuthorities.AddRange([hmrc, irs, cdtfa, fta, zatca, fbr, pra, cra]);

        // Seed Tax Codes & Rates
        var today = DateOnly.FromDateTime(DateTime.Today);
        var ukVat = new TaxCode { Code = "VAT-UK-20", Name = "UK Standard VAT 20%", TaxAuthorityId = hmrc.Id };
        var ukVatRate = new TaxRate { TaxCodeId = ukVat.Id, Percentage = 20m, EffectiveFrom = today };
        ukVat.Rates.Add(ukVatRate);

        var usSalesTax = new TaxCode { Code = "SALES-US-0", Name = "US Default Sales Tax 0%", TaxAuthorityId = irs.Id };
        usSalesTax.Rates.Add(new TaxRate { TaxCodeId = usSalesTax.Id, Percentage = 0, EffectiveFrom = new DateOnly(2020, 1, 1) });

        var usCaSalesTax = new TaxCode { Code = "SALES-CA-7.25", Name = "US California Sales Tax 7.25%", TaxAuthorityId = cdtfa.Id };
        usCaSalesTax.Rates.Add(new TaxRate { TaxCodeId = usCaSalesTax.Id, Percentage = 7.25m, EffectiveFrom = new DateOnly(2020, 1, 1) });

        var uaeVat = new TaxCode { Code = "VAT-UAE-5", Name = "UAE Standard VAT 5%", TaxAuthorityId = fta.Id };
        var uaeVatRate = new TaxRate { TaxCodeId = uaeVat.Id, Percentage = 5m, EffectiveFrom = today };
        uaeVat.Rates.Add(uaeVatRate);

        var ksaVat = new TaxCode { Code = "VAT-KSA-15", Name = "KSA Standard VAT 15%", TaxAuthorityId = zatca.Id };
        var ksaVatRate = new TaxRate { TaxCodeId = ksaVat.Id, Percentage = 15m, EffectiveFrom = today };
        ksaVat.Rates.Add(ksaVatRate);

        var pkSalesTax = new TaxCode { Code = "SALES-PK-18", Name = "Pakistan Sales Tax 18%", TaxAuthorityId = fbr.Id };
        pkSalesTax.Rates.Add(new TaxRate { TaxCodeId = pkSalesTax.Id, Percentage = 18, EffectiveFrom = new DateOnly(2023, 1, 1) });

        var pkPraTax = new TaxCode { Code = "PRA-PK-16", Name = "Punjab Sales Tax 16%", TaxAuthorityId = pra.Id };
        pkPraTax.Rates.Add(new TaxRate { TaxCodeId = pkPraTax.Id, Percentage = 16, EffectiveFrom = new DateOnly(2023, 1, 1) });

        var caGst = new TaxCode { Code = "GST-CA-5", Name = "Canada GST 5%", TaxAuthorityId = cra.Id };
        var caGstRate = new TaxRate { TaxCodeId = caGst.Id, Percentage = 5m, EffectiveFrom = today };
        caGst.Rates.Add(caGstRate);

        var caHst = new TaxCode { Code = "HST-CA-13", Name = "Canada HST 13%", TaxAuthorityId = cra.Id };
        var caHstRate = new TaxRate { TaxCodeId = caHst.Id, Percentage = 13m, EffectiveFrom = today };
        caHst.Rates.Add(caHstRate);

        _taxCodes.AddRange([ukVat, usSalesTax, usCaSalesTax, uaeVat, ksaVat, pkSalesTax, pkPraTax, caGst, caHst]);
        _taxRates.AddRange(_taxCodes.SelectMany(c => c.Rates));

        var defaultWarehouse = new Warehouse { Name = "Main Warehouse", Location = "Headquarters", CompanyId = parentEntity.Id };
        _warehouses.Add(defaultWarehouse);

        Persist();
    }

    private Account Seed(string code, string name, AccountType type, Guid? parent, bool reconciliation = false, decimal opening = 0)
    {
        var a = new Account { Code = code, Name = name, Type = type, ParentId = parent, ReconciliationEnabled = reconciliation, OpeningBalance = opening, OpeningBalanceDate = opening != 0 ? DateOnly.FromDateTime(DateTime.Today) : null };
        _accounts.Add(a); _history[a.Id] = [new(DateTime.UtcNow, "Created", "Starter account")]; return a;
    }

    private void SeedAccounts()
    {
        _accounts.Clear();
        // 1. Assets
        var assets = Seed("10000", "Assets", AccountType.Asset, null);
        
        // Current Assets (11000)
        var currentAssets = Seed("11000", "Current Assets", AccountType.Asset, assets.Id);
        var cashBank = Seed("11100", "Cash & Cash Equivalents", AccountType.Asset, currentAssets.Id, true);
        Seed("11101", "Main Bank Account (HBL)", AccountType.Asset, cashBank.Id, true, 0m);
        Seed("11102", "Petty Cash Fund", AccountType.Asset, cashBank.Id, true, 0m);
        
        var receivables = Seed("12000", "Customer Receivables", AccountType.Asset, currentAssets.Id, true);
        Seed("12001", "Trade Accounts Receivable", AccountType.Asset, receivables.Id, true, 0m);
        
        var advances = Seed("12500", "Advances, Deposits & Prepayments", AccountType.Asset, currentAssets.Id, true);
        Seed("12501", "Prepaid Rent & Expenses", AccountType.Asset, advances.Id, true, 0m);
        
        var inventory = Seed("13000", "Inventories", AccountType.Asset, currentAssets.Id, true);
        Seed("13001", "Finished Goods Stock", AccountType.Asset, inventory.Id, true, 0m);
        
        Seed("13500", "Short-Term Investments", AccountType.Asset, currentAssets.Id, true);
        Seed("14000", "Current Tax & Sales Tax Recoverable", AccountType.Asset, currentAssets.Id, true);

        // Non-Current Assets (15000)
        var nonCurrentAssets = Seed("15000", "Non-Current Assets", AccountType.Asset, assets.Id);
        var ppe = Seed("15100", "Property, Plant & Equipment (PPE)", AccountType.Asset, nonCurrentAssets.Id, true);
        Seed("15101", "Office Equipment & Machinery", AccountType.Asset, ppe.Id, true, 0m);
        
        Seed("15200", "Accumulated Depreciation", AccountType.ContraAsset, nonCurrentAssets.Id, true);
        Seed("15300", "Capital Work-in-Progress (CWIP)", AccountType.Asset, nonCurrentAssets.Id, true);
        Seed("15400", "Right-of-Use (ROU) Assets", AccountType.Asset, nonCurrentAssets.Id, true);
        Seed("15500", "Intangible Assets", AccountType.Asset, nonCurrentAssets.Id, true);
        Seed("16000", "Long-Term Deposits & Investments", AccountType.Asset, nonCurrentAssets.Id, true);

        // 2. Liabilities
        var liabilities = Seed("20000", "Liabilities", AccountType.Liability, null);
        
        // Current Liabilities (21000)
        var currentLiabilities = Seed("21000", "Current Liabilities", AccountType.Liability, liabilities.Id);
        var vendorPayables = Seed("21100", "Vendor Payables", AccountType.Liability, currentLiabilities.Id, true);
        Seed("21101", "Trade Accounts Payable", AccountType.Liability, vendorPayables.Id, true, 0m);
        Seed("21102", "GRNI Accrual Account", AccountType.Liability, vendorPayables.Id, true, 0m);
        
        Seed("21200", "Short-Term Borrowings", AccountType.Liability, currentLiabilities.Id, true);
        Seed("21300", "Unearned / Deferred Revenue", AccountType.Liability, currentLiabilities.Id, true);
        Seed("21400", "Statutory & Tax Liabilities", AccountType.Liability, currentLiabilities.Id, true);
        Seed("21500", "Current Portion of Lease Liabilities", AccountType.Liability, currentLiabilities.Id, true);

        // Non-Current Liabilities (25000)
        var nonCurrentLiabilities = Seed("25000", "Non-Current Liabilities", AccountType.Liability, liabilities.Id);
        Seed("25100", "Long-Term Debt & Loans", AccountType.Liability, nonCurrentLiabilities.Id, true);
        Seed("25200", "Non-Current Lease Liabilities", AccountType.Liability, nonCurrentLiabilities.Id, true);
        Seed("25300", "Deferred Tax Liabilities & Provisions", AccountType.Liability, nonCurrentLiabilities.Id, true);

        // 3. Equity
        var equity = Seed("30000", "Equity", AccountType.Equity, null);
        Seed("31000", "Share Capital / Owner's Equity", AccountType.Equity, equity.Id, true);
        Seed("32000", "Reserves & Surplus", AccountType.Equity, equity.Id, true);
        Seed("33000", "Retained Earnings", AccountType.Equity, equity.Id, true);
        Seed("34000", "Current Year Profit / Loss", AccountType.Equity, equity.Id, true);

        // 4. Revenue
        var revenue = Seed("40000", "Revenue", AccountType.Revenue, null);
        var operatingRevenue = Seed("41000", "Operating Revenue", AccountType.Revenue, revenue.Id);
        var grossSales = Seed("41100", "Gross Sales / Revenue", AccountType.Revenue, operatingRevenue.Id, true);
        Seed("41101", "Product Sales Revenue", AccountType.Revenue, grossSales.Id, true, 0m);
        Seed("41102", "Services Income Revenue", AccountType.Revenue, grossSales.Id, true, 0m);
        Seed("41200", "Sales Deductions & Allowances", AccountType.ContraRevenue, operatingRevenue.Id, true);

        // 5. Cost of Goods Sold
        var cogs = Seed("50000", "Cost of Goods Sold / Direct Costs", AccountType.Expense, null);
        var directCosts = Seed("51000", "Direct Costs / Cost of Sales", AccountType.Expense, cogs.Id);
        Seed("51100", "Cost of Materials & Goods Sold", AccountType.Expense, directCosts.Id, true);
        Seed("51200", "Direct Labor & Personnel Costs", AccountType.Expense, directCosts.Id, true);
        Seed("51300", "Direct Operational Expenses", AccountType.Expense, directCosts.Id, true);

        // 6. Expenses
        var expenses = Seed("60000", "Operating Expenses (OPEX)", AccountType.Expense, null);
        var opex = Seed("61000", "Operating Expenses", AccountType.Expense, expenses.Id);
        var staffCosts = Seed("61100", "Personnel & Staff Costs", AccountType.Expense, opex.Id, true);
        Seed("61101", "Salaries & Wages Expense", AccountType.Expense, staffCosts.Id, true, 0m);
        var adminExpenses = Seed("61200", "Administrative & General Expenses", AccountType.Expense, opex.Id, true);
        Seed("61201", "Office Supplies & Utility Expense", AccountType.Expense, adminExpenses.Id, true, 0m);
        Seed("61300", "Repair & Maintenance Expenses", AccountType.Expense, opex.Id, true);
        Seed("61400", "Selling & Marketing Expenses", AccountType.Expense, opex.Id, true);
        Seed("61500", "Legal & Professional Fees", AccountType.Expense, opex.Id, true);
        Seed("61600", "Depreciation & Amortization Expense", AccountType.Expense, opex.Id, true);

        // 7. Other Income & Expenses
        var otherItems = Seed("80000", "Other Income & Non-Operating Items", AccountType.Revenue, null);
        Seed("81100", "Other Operating / Non-Operating Income", AccountType.Revenue, otherItems.Id, true);
        Seed("81200", "Finance Income", AccountType.Revenue, otherItems.Id, true);
        Seed("82100", "Finance Costs & Bank Charges", AccountType.Expense, otherItems.Id, true);
        Seed("83100", "Taxation Expense", AccountType.Expense, otherItems.Id, true);
    }

    public IReadOnlyList<Account> Accounts => _accounts;
    public IReadOnlyList<JournalEntry> Entries => _entries;
    public IReadOnlyList<JournalTemplate> Templates => _templates;
    public IReadOnlyList<RecurringJournalEntry> RecurringEntries => _recurringEntries;
    public IReadOnlyList<IntercompanyAllocation> IntercompanyAllocations => _intercompanyAllocations;
    public IReadOnlyList<Company> Companies => _companies;
    public IReadOnlyList<Customer> Customers => _customers;
    public IReadOnlyList<Product> Products => _products;
    public IReadOnlyList<Vendor> Vendors => _vendors;
    public IReadOnlyList<PurchaseOrder> PurchaseOrders => _purchaseOrders;
    public IReadOnlyList<GoodsReceiptNote> GoodsReceiptNotes => _grns;
    public IReadOnlyList<PurchaseRequest> PurchaseRequests => _prs;
    public IReadOnlyList<RequestForQuotation> RequestForQuotations => _rfqs;
    public IReadOnlyList<VendorQuote> VendorQuotes => _vendorQuotes;
    public IReadOnlyList<VendorBill> VendorBills => _vendorBills;
    public IReadOnlyList<FixedAsset> FixedAssets => _fixedAssets;
    public IReadOnlyList<TaxAuthority> TaxAuthorities => _taxAuthorities;
    public IReadOnlyList<TaxCode> TaxCodes => _taxCodes;
    public IReadOnlyList<Warehouse> Warehouses => _warehouses;
    public IReadOnlyList<StockLevel> StockLevels => _stockLevels;
    public IReadOnlyList<StockTransaction> StockTransactions => _stockTransactions;
    public IReadOnlyList<SalesInvoice> SalesInvoices => _salesInvoices;
    public IReadOnlyList<Estimate> Estimates => _estimates;
    public IReadOnlyList<TaxRate> TaxRates => _taxRates;

    public Customer? FindCustomer(Guid id) => _customers.FirstOrDefault(x => x.Id == id);
    public string NextCustomerNumber()
    {
        var numbers = _customers.Select(c => c.CustomerNumber).Where(n => n.StartsWith("CUST-") && int.TryParse(n[5..], out _)).Select(n => int.Parse(n[5..])).DefaultIfEmpty(0);
        return $"CUST-{(numbers.Max() + 1):D4}";
    }

    public bool CreateCustomer(CustomerRequest request, out Customer? customer, out string? error)
    {
        customer = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Name)) { error = "Customer name is required."; return false; }
        if (!string.IsNullOrWhiteSpace(request.CustomerNumber) && _customers.Any(x => x.CustomerNumber.Equals(request.CustomerNumber.Trim(), StringComparison.OrdinalIgnoreCase))) { error = "A customer with this number already exists."; return false; }
        if (request.CompanyId is { } companyId && !_companies.Any(x => x.Id == companyId && x.Active)) { error = "Associated company entity must be active."; return false; }

        lock (_lock)
        {
            customer = new Customer { CustomerNumber = string.IsNullOrWhiteSpace(request.CustomerNumber) ? NextCustomerNumber() : request.CustomerNumber.Trim(), Name = request.Name.Trim(), Email = request.Email?.Trim(), Phone = request.Phone?.Trim(), TaxId = request.TaxId?.Trim(), AddressLine1 = request.AddressLine1?.Trim(), AddressLine2 = request.AddressLine2?.Trim(), City = request.City?.Trim(), State = request.State?.Trim(), PostalCode = request.PostalCode?.Trim(), Country = string.IsNullOrWhiteSpace(request.Country) ? "United States" : request.Country.Trim(), CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "USD" : request.CurrencyCode.Trim().ToUpperInvariant(), CreditLimit = request.CreditLimit < 0 ? 0m : request.CreditLimit, PaymentTermsDays = request.PaymentTermsDays <= 0 ? 30 : request.PaymentTermsDays, CompanyId = request.CompanyId };
            _customers.Add(customer); Persist(); return true;
        }
    }

    public bool UpdateCustomer(Guid id, CustomerRequest request, out Customer? customer, out string? error)
    {
        customer = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Name)) { error = "Customer name is required."; return false; }

        lock (_lock)
        {
            customer = FindCustomer(id);
            if (customer is null) { error = "Customer not found."; return false; }
            if (!string.IsNullOrWhiteSpace(request.CustomerNumber) && _customers.Any(x => x.Id != id && x.CustomerNumber.Equals(request.CustomerNumber.Trim(), StringComparison.OrdinalIgnoreCase))) { error = "Another customer with this number already exists."; return false; }
            
            customer.CustomerNumber = string.IsNullOrWhiteSpace(request.CustomerNumber) ? customer.CustomerNumber : request.CustomerNumber.Trim();
            customer.Name = request.Name.Trim(); customer.Email = request.Email?.Trim(); customer.Phone = request.Phone?.Trim(); customer.TaxId = request.TaxId?.Trim(); customer.AddressLine1 = request.AddressLine1?.Trim(); customer.AddressLine2 = request.AddressLine2?.Trim(); customer.City = request.City?.Trim(); customer.State = request.State?.Trim(); customer.PostalCode = request.PostalCode?.Trim(); customer.Country = string.IsNullOrWhiteSpace(request.Country) ? "United States" : request.Country.Trim(); customer.CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "USD" : request.CurrencyCode.Trim().ToUpperInvariant(); customer.CreditLimit = request.CreditLimit < 0 ? 0m : request.CreditLimit; customer.PaymentTermsDays = request.PaymentTermsDays <= 0 ? 30 : request.PaymentTermsDays; customer.CompanyId = request.CompanyId; customer.UpdatedAt = DateTime.UtcNow;
            Persist(); return true;
        }
    }

    public bool SetCustomerStatus(Guid id, CustomerStatus status, out string? error) { error = null; lock (_lock) { var customer = FindCustomer(id); if (customer is null) { error = "Customer not found."; return false; } customer.Status = status; customer.UpdatedAt = DateTime.UtcNow; Persist(); return true; } }
    public bool DeleteCustomer(Guid id, out string? error) { error = null; lock (_lock) { var customer = FindCustomer(id); if (customer is null) { error = "Customer not found."; return false; } _customers.Remove(customer); Persist(); return true; } }

    public Product? FindProduct(Guid id) => _products.FirstOrDefault(x => x.Id == id);
    public string NextProductCode() { var numbers = _products.Select(c => c.Code).Where(n => n.StartsWith("ITEM-") && int.TryParse(n[5..], out _)).Select(n => int.Parse(n[5..])).DefaultIfEmpty(0); return $"ITEM-{(numbers.Max() + 1):D4}"; }
    public bool CreateProduct(ProductRequest request, out Product? product, out string? error)
    {
        product = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Name)) { error = "Product name is required."; return false; }
        if (!string.IsNullOrWhiteSpace(request.Code) && _products.Any(x => x.Code.Equals(request.Code.Trim(), StringComparison.OrdinalIgnoreCase))) { error = "A product with this code already exists."; return false; }
        lock (_lock)
        {
            product = new Product { Code = string.IsNullOrWhiteSpace(request.Code) ? NextProductCode() : request.Code.Trim(), Name = request.Name.Trim(), Description = request.Description?.Trim(), Type = request.Type, Category = request.Category?.Trim(), Unit = string.IsNullOrWhiteSpace(request.Unit) ? "Each" : request.Unit.Trim(), UnitPrice = request.UnitPrice < 0 ? 0m : request.UnitPrice, CostPrice = request.CostPrice < 0 ? 0m : request.CostPrice, TaxCodeId = request.TaxCodeId, IncomeAccountId = request.IncomeAccountId, ExpenseAccountId = request.ExpenseAccountId, AssetAccountId = request.AssetAccountId };
            _products.Add(product); Persist(); return true;
        }
    }
    public bool UpdateProduct(Guid id, ProductRequest request, out Product? product, out string? error)
    {
        product = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Name)) { error = "Product name is required."; return false; }
        lock (_lock)
        {
            product = FindProduct(id); if (product is null) { error = "Product not found."; return false; }
            if (!string.IsNullOrWhiteSpace(request.Code) && _products.Any(x => x.Id != id && x.Code.Equals(request.Code.Trim(), StringComparison.OrdinalIgnoreCase))) { error = "Another product with this code already exists."; return false; }
            product.Code = string.IsNullOrWhiteSpace(request.Code) ? product.Code : request.Code.Trim(); product.Name = request.Name.Trim(); product.Description = request.Description?.Trim(); product.Type = request.Type; product.Category = request.Category?.Trim(); product.Unit = string.IsNullOrWhiteSpace(request.Unit) ? "Each" : request.Unit.Trim(); product.UnitPrice = request.UnitPrice < 0 ? 0m : request.UnitPrice; product.CostPrice = request.CostPrice < 0 ? 0m : request.CostPrice; product.TaxCodeId = request.TaxCodeId; product.IncomeAccountId = request.IncomeAccountId; product.ExpenseAccountId = request.ExpenseAccountId; product.AssetAccountId = request.AssetAccountId; product.UpdatedAt = DateTime.UtcNow;
            Persist(); return true;
        }
    }
    public bool SetProductStatus(Guid id, ProductStatus status, out string? error) { error = null; lock (_lock) { var product = FindProduct(id); if (product is null) { error = "Product not found."; return false; } product.Status = status; product.UpdatedAt = DateTime.UtcNow; Persist(); return true; } }
    public bool DeleteProduct(Guid id, out string? error) { error = null; lock (_lock) { var product = FindProduct(id); if (product is null) { error = "Product not found."; return false; } _products.Remove(product); Persist(); return true; } }

    public Vendor? FindVendor(Guid id) => _vendors.FirstOrDefault(x => x.Id == id);
    public string NextVendorNumber() { var numbers = _vendors.Select(c => c.VendorNumber).Where(n => n.StartsWith("VEND-") && int.TryParse(n[5..], out _)).Select(n => int.Parse(n[5..])).DefaultIfEmpty(0); return $"VEND-{(numbers.Max() + 1):D4}"; }
    public bool CreateVendor(VendorRequest request, out Vendor? vendor, out string? error)
    {
        vendor = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Name)) { error = "Vendor name is required."; return false; }
        lock (_lock)
        {
            vendor = new Vendor { VendorNumber = string.IsNullOrWhiteSpace(request.VendorNumber) ? NextVendorNumber() : request.VendorNumber.Trim(), Name = request.Name.Trim(), Email = request.Email?.Trim(), Phone = request.Phone?.Trim(), TaxId = request.TaxId?.Trim(), AddressLine1 = request.AddressLine1?.Trim(), AddressLine2 = request.AddressLine2?.Trim(), City = request.City?.Trim(), State = request.State?.Trim(), PostalCode = request.PostalCode?.Trim(), Country = string.IsNullOrWhiteSpace(request.Country) ? "United States" : request.Country.Trim(), CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "USD" : request.CurrencyCode.Trim().ToUpperInvariant(), PaymentTermsDays = request.PaymentTermsDays <= 0 ? 30 : request.PaymentTermsDays, DefaultExpenseAccountId = request.DefaultExpenseAccountId, CompanyId = request.CompanyId };
            _vendors.Add(vendor); Persist(); return true;
        }
    }
    public bool UpdateVendor(Guid id, VendorRequest request, out Vendor? vendor, out string? error)
    {
        vendor = null; error = null;
        lock (_lock)
        {
            vendor = FindVendor(id); if (vendor is null) { error = "Vendor not found."; return false; }
            vendor.VendorNumber = string.IsNullOrWhiteSpace(request.VendorNumber) ? vendor.VendorNumber : request.VendorNumber.Trim(); vendor.Name = request.Name.Trim(); vendor.Email = request.Email?.Trim(); vendor.Phone = request.Phone?.Trim(); vendor.TaxId = request.TaxId?.Trim(); vendor.AddressLine1 = request.AddressLine1?.Trim(); vendor.AddressLine2 = request.AddressLine2?.Trim(); vendor.City = request.City?.Trim(); vendor.State = request.State?.Trim(); vendor.PostalCode = request.PostalCode?.Trim(); vendor.Country = string.IsNullOrWhiteSpace(request.Country) ? "United States" : request.Country.Trim(); vendor.CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "USD" : request.CurrencyCode.Trim().ToUpperInvariant(); vendor.PaymentTermsDays = request.PaymentTermsDays <= 0 ? 30 : request.PaymentTermsDays; vendor.DefaultExpenseAccountId = request.DefaultExpenseAccountId; vendor.CompanyId = request.CompanyId; vendor.UpdatedAt = DateTime.UtcNow;
            Persist(); return true;
        }
    }
    public bool SetVendorStatus(Guid id, VendorStatus status, out string? error) { error = null; lock (_lock) { var vendor = FindVendor(id); if (vendor is null) { error = "Vendor not found."; return false; } vendor.Status = status; vendor.UpdatedAt = DateTime.UtcNow; Persist(); return true; } }
    public bool DeleteVendor(Guid id, out string? error) { error = null; lock (_lock) { var vendor = FindVendor(id); if (vendor is null) { error = "Vendor not found."; return false; } _vendors.Remove(vendor); Persist(); return true; } }

    public PurchaseOrder? FindPurchaseOrder(Guid id) => _purchaseOrders.FirstOrDefault(x => x.Id == id);
    public string NextPoNumber() { var numbers = _purchaseOrders.Select(c => c.PoNumber).Where(n => n.StartsWith("PO-") && int.TryParse(n[3..], out _)).Select(n => int.Parse(n[3..])).DefaultIfEmpty(0); return $"PO-{(numbers.Max() + 1):D4}"; }
    
    public bool CreatePurchaseOrder(PurchaseOrderRequest request, out PurchaseOrder? po, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var vendor = _vendors.FirstOrDefault(v => v.Id == request.VendorId);
            if (vendor == null) { error = "Vendor not found."; po = null; return false; }
            po = new PurchaseOrder
            {
                PoNumber = request.PoNumber ?? NextPoNumber(),
                VendorId = request.VendorId,
                VendorQuoteId = request.VendorQuoteId,
                CompanyId = request.CompanyId ?? vendor.CompanyId,
                Date = request.Date,
                ExpectedDeliveryDate = request.ExpectedDeliveryDate,
                Lines = request.Lines.Select(l => new PurchaseOrderLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    TaxCodeId = l.TaxCodeId,
                    TaxAmount = l.TaxAmount,
                    Destination = l.Destination
                }).ToList()
            };
            _purchaseOrders.Add(po);
            Persist(); return true;
        }
    }

    public bool UpdatePurchaseOrderStatus(Guid id, PurchaseOrderStatus status, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var po = _purchaseOrders.FirstOrDefault(x => x.Id == id);
            if (po == null) { error = "PO not found."; return false; }
            po.Status = status;
            return true;
        }
    }

    public GoodsReceiptNote? FindGoodsReceiptNote(Guid id) => _grns.FirstOrDefault(x => x.Id == id);
    public string NextGrnNumber() { var numbers = _grns.Select(c => c.GrnNumber).Where(n => n.StartsWith("GRN-") && int.TryParse(n[4..], out _)).Select(n => int.Parse(n[4..])).DefaultIfEmpty(0); return $"GRN-{(numbers.Max() + 1):D4}"; }
    
    public bool CreateGoodsReceiptNote(GoodsReceiptNoteRequest request, out GoodsReceiptNote? grn, out string? error)
    {
        grn = null; error = null;
        lock (_lock)
        {
            var po = FindPurchaseOrder(request.PurchaseOrderId);
            if (po == null) { error = "Purchase order not found."; return false; }
            if (request.Lines.Count == 0) { error = "GRN must have at least one line."; return false; }

            grn = new GoodsReceiptNote
            {
                GrnNumber = string.IsNullOrWhiteSpace(request.GrnNumber) ? NextGrnNumber() : request.GrnNumber.Trim(),
                PurchaseOrderId = request.PurchaseOrderId,
                DateReceived = request.DateReceived,
                Notes = request.Notes,
                Lines = request.Lines.Select(l => new GoodsReceiptNoteLine
                {
                    PurchaseOrderLineId = l.PurchaseOrderLineId,
                    QuantityReceived = l.QuantityReceived
                }).ToList()
            };
            _grns.Add(grn); Persist(); return true;
        }
    }

    public PurchaseRequest? FindPurchaseRequest(Guid id) => _prs.FirstOrDefault(x => x.Id == id);
    
    public bool CreatePurchaseRequest(PurchaseRequestRequest request, Guid companyId, out PurchaseRequest? pr, out string? error)
    {
        error = null;
        lock (_lock)
        {
            pr = new PurchaseRequest
            {
                RequestNumber = request.RequestNumber,
                RequesterName = request.RequesterName,
                Date = request.Date,
                CompanyId = companyId,
                Lines = request.Lines.Select(l => new PurchaseRequestLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity
                }).ToList()
            };
            _prs.Add(pr);
            return true;
        }
    }

    public bool UpdatePurchaseRequestStatus(Guid id, PurchaseRequestStatus status, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var pr = _prs.FirstOrDefault(x => x.Id == id);
            if (pr == null) { error = "PR not found."; return false; }
            pr.Status = status;
            return true;
        }
    }

    public RequestForQuotation? FindRfq(Guid id) => _rfqs.FirstOrDefault(x => x.Id == id);

    public bool CreateRfq(RfqRequest request, Guid companyId, out RequestForQuotation? rfq, out string? error)
    {
        error = null;
        lock (_lock)
        {
            if (request.PurchaseRequestId.HasValue)
            {
                var pr = _prs.FirstOrDefault(x => x.Id == request.PurchaseRequestId.Value);
                if (pr != null) pr.Status = PurchaseRequestStatus.Ordered; // Rfq generated
            }

            rfq = new RequestForQuotation
            {
                RfqNumber = request.RfqNumber,
                PurchaseRequestId = request.PurchaseRequestId,
                Date = request.Date,
                Deadline = request.Deadline,
                CompanyId = companyId,
                Lines = request.Lines.Select(l => new RequestForQuotationLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity
                }).ToList()
            };
            _rfqs.Add(rfq);
            return true;
        }
    }

    public bool SubmitVendorQuote(VendorQuoteRequest request, out VendorQuote? quote, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var rfq = _rfqs.FirstOrDefault(x => x.Id == request.RequestForQuotationId);
            if (rfq == null) { error = "RFQ not found."; quote = null; return false; }

            quote = new VendorQuote
            {
                RequestForQuotationId = request.RequestForQuotationId,
                VendorId = request.VendorId,
                Date = request.Date,
                Lines = request.Lines.Select(l => new VendorQuoteLine
                {
                    ProductId = l.ProductId,
                    UnitPrice = l.UnitPrice,
                    TaxCodeId = l.TaxCodeId,
                    TaxAmount = l.TaxAmount
                }).ToList()
            };
            _vendorQuotes.Add(quote);
            return true;
        }
    }

    public bool AwardQuote(Guid rfqId, Guid quoteId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var rfq = _rfqs.FirstOrDefault(x => x.Id == rfqId);
            if (rfq == null) { error = "RFQ not found."; return false; }

            var quotes = _vendorQuotes.Where(x => x.RequestForQuotationId == rfqId).ToList();
            var winning = quotes.FirstOrDefault(x => x.Id == quoteId);
            if (winning == null) { error = "Quote not found."; return false; }

            foreach (var q in quotes) q.IsWinningQuote = false;
            winning.IsWinningQuote = true;
            rfq.Status = RfqStatus.Awarded;
            return true;
        }
    }

    public bool CreateVendorBill(VendorBillRequest request, out VendorBill? bill, out string? error)
    {
        error = null;
        lock (_lock)
        {
            if (request.PurchaseOrderId.HasValue && request.GoodsReceiptNoteId.HasValue)
            {
                var po = _purchaseOrders.FirstOrDefault(x => x.Id == request.PurchaseOrderId.Value);
                var grn = _grns.FirstOrDefault(x => x.Id == request.GoodsReceiptNoteId.Value);
                if (po == null || grn == null) { error = "PO or GRN not found."; bill = null; return false; }

                // Basic 3-way match validation warning if quantities or prices are mismatched
                foreach (var line in request.Lines)
                {
                    var poLine = po.Lines.FirstOrDefault(x => x.ProductId == line.ProductId);
                    var grnLine = poLine != null ? grn.Lines.FirstOrDefault(x => x.PurchaseOrderLineId == poLine.Id) : null;
                    
                    if (poLine != null && grnLine != null)
                    {
                        if (line.Quantity > grnLine.QuantityReceived || line.UnitPrice != poLine.UnitPrice)
                        {
                            // In real system, we flag the bill, but for now we just allow it with warning true
                            // The warning is passed from frontend or evaluated here. Let's just trust the request.HasVarianceWarning
                        }
                    }
                }
            }

            bill = new VendorBill
            {
                BillNumber = request.BillNumber,
                VendorInvoiceNumber = request.VendorInvoiceNumber,
                VendorId = request.VendorId,
                PurchaseOrderId = request.PurchaseOrderId,
                GoodsReceiptNoteId = request.GoodsReceiptNoteId,
                Date = request.Date,
                DueDate = request.DueDate,
                CompanyId = request.CompanyId,
                HasVarianceWarning = request.HasVarianceWarning,
                Lines = request.Lines.Select(l => new VendorBillLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    TaxCodeId = l.TaxCodeId,
                    TaxAmount = l.TaxAmount,
                    Destination = l.Destination
                }).ToList()
            };
            _vendorBills.Add(bill);
            return true;
        }
    }

    public bool ProcessGoodsReceiptNote(Guid grnId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var grn = FindGoodsReceiptNote(grnId);
            if (grn == null) { error = "GRN not found."; return false; }
            if (grn.IsProcessed) { error = "GRN is already processed."; return false; }

            var po = FindPurchaseOrder(grn.PurchaseOrderId);
            if (po == null) { error = "Associated PO not found."; return false; }

            // 1. Update Inventory and create Fixed Assets
            foreach (var grnLine in grn.Lines)
            {
                var poLine = po.Lines.FirstOrDefault(l => l.Id == grnLine.PurchaseOrderLineId);
                if (poLine == null) continue;
                
                poLine.ReceivedQuantity += grnLine.QuantityReceived;
                
                var product = FindProduct(poLine.ProductId);
                if (product != null)
                {
                    if (poLine.Destination == LineDestination.Inventory)
                    {
                        product.QuantityOnHand += grnLine.QuantityReceived;

                        // Find or create StockLevel for default warehouse
                        var warehouse = _warehouses.FirstOrDefault(w => w.CompanyId == po.CompanyId) ?? _warehouses.FirstOrDefault();
                        if (warehouse != null)
                        {
                            var stockLevel = _stockLevels.FirstOrDefault(s => s.ProductId == product.Id && s.WarehouseId == warehouse.Id);
                            if (stockLevel == null)
                            {
                                stockLevel = new StockLevel { ProductId = product.Id, WarehouseId = warehouse.Id, CompanyId = po.CompanyId };
                                _stockLevels.Add(stockLevel);
                            }
                            // Moving average cost calculation
                            var totalQty = stockLevel.QuantityOnHand + grnLine.QuantityReceived;
                            var totalCost = (stockLevel.QuantityOnHand * stockLevel.MovingAverageCost) + (grnLine.QuantityReceived * poLine.UnitPrice);
                            stockLevel.MovingAverageCost = totalQty > 0 ? totalCost / totalQty : poLine.UnitPrice;
                            stockLevel.QuantityOnHand = totalQty;

                            _stockTransactions.Add(new StockTransaction
                            {
                                Date = grn.DateReceived,
                                ProductId = product.Id,
                                WarehouseId = warehouse.Id,
                                Quantity = grnLine.QuantityReceived,
                                UnitCost = poLine.UnitPrice,
                                Type = StockTransactionType.In,
                                Reference = grn.GrnNumber,
                                CompanyId = po.CompanyId
                            });
                        }
                    }
                    else if (poLine.Destination == LineDestination.FixedAsset)
                    {
                        // Create a fixed asset entry for EACH quantity received (e.g. 5 laptops = 5 assets)
                        for (int i = 0; i < (int)grnLine.QuantityReceived; i++)
                        {
                            var asset = new FixedAsset
                            {
                                AssetTag = $"FA-{DateTime.UtcNow.Ticks.ToString()[^6..]}-{i}", // Quick unique tag
                                Name = product.Name,
                                Description = $"Received from PO {po.PoNumber}",
                                PurchaseDate = grn.DateReceived,
                                PurchasePrice = poLine.UnitPrice, // Cost per unit
                                Status = AssetStatus.Active,
                                CompanyId = po.CompanyId
                            };
                            _fixedAssets.Add(asset);
                        }
                    }
                }
            }

            // 2. Update PO Status
            bool allReceived = po.Lines.All(l => l.ReceivedQuantity >= l.Quantity);
            bool someReceived = po.Lines.Any(l => l.ReceivedQuantity > 0);
            po.Status = allReceived ? PurchaseOrderStatus.Fulfilled : (someReceived ? PurchaseOrderStatus.PartiallyReceived : PurchaseOrderStatus.Issued);

            // 3. Optional: Create Accrual Journal Entry (GRNI) 
            // In a real system, you would sum the amounts by GL account and create a balanced entry here.
            
            grn.IsProcessed = true;
            Persist();
            return true;
        }
    }

    // Fixed Asset Disposal (IAS 16 compliant - posts gain/loss journal)
    public bool DisposeAsset(Guid assetId, DateOnly disposalDate, decimal proceeds, Guid assetAccountId, Guid accumDeprAccountId, Guid gainLossAccountId, Guid? cashAccountId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var asset = _fixedAssets.FirstOrDefault(a => a.Id == assetId);
            if (asset == null) { error = "Asset not found."; return false; }
            if (asset.Status == AssetStatus.Disposed) { error = "Asset is already disposed."; return false; }

            var nbv = asset.PurchasePrice - asset.AccumulatedDepreciation;
            var gainOrLoss = proceeds - nbv; // positive = gain, negative = loss

            var lines = new List<JournalLine>
            {
                // Remove asset at cost: Cr Asset Account
                new JournalLine(assetAccountId, 0, asset.PurchasePrice, $"Disposal of {asset.Name} (cost)", null, null, 1, asset.CompanyId),
                // Remove accumulated depreciation: Dr Accum Depr Account
                new JournalLine(accumDeprAccountId, asset.AccumulatedDepreciation, 0, $"Disposal of {asset.Name} (accum depr)", null, null, 1, asset.CompanyId),
            };

            if (proceeds > 0 && cashAccountId.HasValue)
                lines.Add(new JournalLine(cashAccountId.Value, proceeds, 0, $"Proceeds from disposal of {asset.Name}", null, null, 1, asset.CompanyId));

            if (gainOrLoss > 0)
                lines.Add(new JournalLine(gainLossAccountId, 0, gainOrLoss, $"Gain on disposal of {asset.Name}", null, null, 1, asset.CompanyId));
            else if (gainOrLoss < 0)
                lines.Add(new JournalLine(gainLossAccountId, Math.Abs(gainOrLoss), 0, $"Loss on disposal of {asset.Name}", null, null, 1, asset.CompanyId));

            var journalEntry = new JournalEntry
            {
                Date = disposalDate,
                Reference = $"DISP-{asset.AssetTag}",
                Description = $"Disposal of fixed asset: {asset.Name}",
                TransactionType = TransactionType.WriteOff,
                CompanyId = asset.CompanyId,
                Lines = lines,
                Status = JournalStatus.Posted
            };
            _entries.Add(journalEntry);

            asset.Status = AssetStatus.Disposed;
            asset.UpdatedAt = DateTime.UtcNow;
            Persist();
            return true;
        }
    }

    // Inventory / Warehouse CRUD
    public bool CreateWarehouse(string name, string? location, Guid? companyId, out Warehouse? warehouse, out string? error)
    {
        error = null;
        if (string.IsNullOrWhiteSpace(name)) { error = "Warehouse name is required."; warehouse = null; return false; }
        lock (_lock)
        {
            warehouse = new Warehouse { Name = name.Trim(), Location = location?.Trim(), CompanyId = companyId };
            _warehouses.Add(warehouse);
            Persist();
            return true;
        }
    }

    public bool CreateStockTransaction(StockTransaction request, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var warehouse = _warehouses.FirstOrDefault(w => w.Id == request.WarehouseId);
            if (warehouse == null) { error = "Warehouse not found."; return false; }

            var stockLevel = _stockLevels.FirstOrDefault(s => s.ProductId == request.ProductId && s.WarehouseId == request.WarehouseId);
            if (stockLevel == null)
            {
                stockLevel = new StockLevel { ProductId = request.ProductId, WarehouseId = request.WarehouseId, CompanyId = request.CompanyId };
                _stockLevels.Add(stockLevel);
            }

            if (request.Type == StockTransactionType.Out || request.Type == StockTransactionType.Transfer)
            {
                if (stockLevel.QuantityOnHand < request.Quantity) { error = "Insufficient stock."; return false; }
                stockLevel.QuantityOnHand -= request.Quantity;
            }
            else
            {
                var totalQty = stockLevel.QuantityOnHand + request.Quantity;
                var totalCost = (stockLevel.QuantityOnHand * stockLevel.MovingAverageCost) + (request.Quantity * request.UnitCost);
                stockLevel.MovingAverageCost = totalQty > 0 ? totalCost / totalQty : request.UnitCost;
                stockLevel.QuantityOnHand = totalQty;
            }

            _stockTransactions.Add(request);
            Persist();
            return true;
        }
    }

    // Fixed Asset Depreciation (posts a real double-entry journal)
    public bool RunDepreciation(Guid assetId, Guid depreciationExpenseAccountId, Guid accumulatedDepreciationAccountId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var asset = _fixedAssets.FirstOrDefault(a => a.Id == assetId);
            if (asset == null) { error = "Asset not found."; return false; }
            if (asset.Status != AssetStatus.Active) { error = "Asset is not active."; return false; }

            // Straight-Line: (Cost - Salvage) / UsefulLife / 12 per month
            var annualDepreciation = (asset.PurchasePrice - asset.SalvageValue) / asset.UsefulLifeYears;
            var monthlyDepreciation = Math.Round(annualDepreciation / 12, 2);

            if (monthlyDepreciation <= 0) { error = "No depreciation to post."; return false; }
            if (asset.AccumulatedDepreciation + monthlyDepreciation > (asset.PurchasePrice - asset.SalvageValue))
            {
                monthlyDepreciation = (asset.PurchasePrice - asset.SalvageValue) - asset.AccumulatedDepreciation;
                asset.Status = AssetStatus.Depreciated;
            }

            asset.AccumulatedDepreciation += monthlyDepreciation;
            asset.UpdatedAt = DateTime.UtcNow;

            // Post double-entry journal: Dr Depreciation Expense / Cr Accumulated Depreciation
            var journalEntry = new JournalEntry
            {
                Date = DateOnly.FromDateTime(DateTime.Today),
                Reference = $"DEP-{asset.AssetTag}",
                Description = $"Monthly depreciation for {asset.Name}",
                TransactionType = TransactionType.Depreciation,
                CompanyId = asset.CompanyId,
                Lines =
                [
                    new JournalLine(depreciationExpenseAccountId, monthlyDepreciation, 0, $"Depreciation: {asset.Name}", null, null, 1, asset.CompanyId),
                    new JournalLine(accumulatedDepreciationAccountId, 0, monthlyDepreciation, $"Accum. Depr: {asset.Name}", null, null, 1, asset.CompanyId)
                ]
            };
            journalEntry.Status = JournalStatus.Posted;
            _entries.Add(journalEntry);
            Persist();
            return true;
        }
    }
    
    // ─── Estimates & Quotes ───────────────────────────────────────────────────
    public bool CreateEstimate(EstimateRequest request, out Estimate? estimate, out string? error)
    {
        error = null; estimate = null;
        if (request.Lines == null || request.Lines.Count == 0) { error = "Estimate must have at least one line."; return false; }
        lock (_lock)
        {
            if (FindCustomer(request.CustomerId) == null) { error = "Customer not found."; return false; }
            var number = request.EstimateNumber ?? $"EST-{DateTime.UtcNow:yyyyMMddHHmmss}";
            estimate = new Estimate
            {
                EstimateNumber = number,
                CustomerId = request.CustomerId,
                EstimateDate = request.EstimateDate,
                ExpiryDate = request.ExpiryDate,
                Reference = request.Reference,
                Notes = request.Notes,
                Terms = request.Terms,
                CompanyId = request.CompanyId,
                Lines = request.Lines.Select(l => new EstimateLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    DiscountType = l.DiscountType,
                    DiscountValue = l.DiscountValue,
                    TaxCodeId = l.TaxCodeId,
                    TaxPercent = l.TaxPercent
                }).ToList()
            };
            _estimates.Add(estimate);
            Persist();
            return true;
        }
    }

    public bool UpdateEstimateStatus(Guid id, EstimateStatus status, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var estimate = _estimates.FirstOrDefault(e => e.Id == id);
            if (estimate == null) { error = "Estimate not found."; return false; }
            estimate.Status = status;
            estimate.UpdatedAt = DateTime.UtcNow;
            Persist();
            return true;
        }
    }

    public bool ConvertEstimateToInvoice(Guid estimateId, DateOnly invoiceDate, DateOnly dueDate, out SalesInvoice? invoice, out string? error)
    {
        error = null; invoice = null;
        lock (_lock)
        {
            var estimate = _estimates.FirstOrDefault(e => e.Id == estimateId);
            if (estimate == null) { error = "Estimate not found."; return false; }
            if (estimate.Status == EstimateStatus.Invoiced) { error = "This estimate has already been converted to an invoice."; return false; }

            var invoiceRequest = new SalesInvoiceRequest(
                InvoiceNumber: null,
                CustomerId: estimate.CustomerId,
                InvoiceDate: invoiceDate,
                DueDate: dueDate,
                Reference: estimate.EstimateNumber,
                Notes: estimate.Notes,
                Lines: estimate.Lines.Select(l => new SalesInvoiceLineRequest(
                    ProductId: l.ProductId,
                    Description: l.Description,
                    Quantity: l.Quantity,
                    UnitPrice: l.UnitPrice,
                    DiscountAmount: l.DiscountAmount,
                    TaxCodeId: l.TaxCodeId,
                    TaxAmount: l.TaxAmount
                )).ToList(),
                CompanyId: estimate.CompanyId
            );

            if (!CreateSalesInvoice(invoiceRequest, out invoice, out error)) return false;

            estimate.Status = EstimateStatus.Invoiced;
            estimate.ConvertedToInvoiceId = invoice!.Id;
            estimate.UpdatedAt = DateTime.UtcNow;
            Persist();
            return true;
        }
    }

    // ─── Sales Invoices ───────────────────────────────────────────────────────
    public bool CreateSalesInvoice(SalesInvoiceRequest request, out SalesInvoice? invoice, out string? error)
    {
        error = null; invoice = null;
        if (request.Lines == null || request.Lines.Count == 0) { error = "Invoice must have at least one line."; return false; }
        lock (_lock)
        {
            var customer = FindCustomer(request.CustomerId);
            if (customer == null) { error = "Customer not found."; return false; }

            var number = request.InvoiceNumber ?? $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}";
            invoice = new SalesInvoice
            {
                InvoiceNumber = number,
                CustomerId = request.CustomerId,
                InvoiceDate = request.InvoiceDate,
                DueDate = request.DueDate,
                Reference = request.Reference,
                Notes = request.Notes,
                CompanyId = request.CompanyId,
                Lines = request.Lines.Select(l => new SalesInvoiceLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    DiscountAmount = l.DiscountAmount,
                    TaxCodeId = l.TaxCodeId,
                    TaxAmount = l.TaxAmount
                }).ToList()
            };
            _salesInvoices.Add(invoice);
            Persist();
            return true;
        }
    }

    public bool PostSalesInvoice(Guid invoiceId, Guid arAccountId, Guid revenueAccountId, Guid? taxLiabilityAccountId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var invoice = _salesInvoices.FirstOrDefault(i => i.Id == invoiceId);
            if (invoice == null) { error = "Invoice not found."; return false; }
            if (invoice.Status != SalesInvoiceStatus.Draft) { error = "Only draft invoices can be posted."; return false; }

            // 1. Post AR Journal: Dr AR / Cr Revenue (+ Cr Tax Liability if applicable)
            var journalLines = new List<JournalLine>
            {
                new JournalLine(arAccountId, invoice.TotalAmount, 0, $"AR: {invoice.InvoiceNumber}", null, null, 1, invoice.CompanyId)
            };

            var revenueTotal = invoice.SubTotal - invoice.DiscountTotal;
            journalLines.Add(new JournalLine(revenueAccountId, 0, revenueTotal, $"Revenue: {invoice.InvoiceNumber}", null, null, 1, invoice.CompanyId));

            if (invoice.TaxTotal > 0 && taxLiabilityAccountId.HasValue)
                journalLines.Add(new JournalLine(taxLiabilityAccountId.Value, 0, invoice.TaxTotal, $"Tax: {invoice.InvoiceNumber}", null, null, 1, invoice.CompanyId));

            var journal = new JournalEntry
            {
                Date = invoice.InvoiceDate,
                Reference = invoice.InvoiceNumber,
                Description = $"Sales invoice to customer {_customers.FirstOrDefault(c => c.Id == invoice.CustomerId)?.Name ?? invoice.CustomerId.ToString()}",
                TransactionType = TransactionType.Sales,
                CompanyId = invoice.CompanyId,
                Lines = journalLines,
                Status = JournalStatus.Posted
            };
            _entries.Add(journal);

            // 2. Auto Stock-Out for Physical products
            if (!invoice.StockReduced)
            {
                var warehouse = _warehouses.FirstOrDefault(w => w.CompanyId == invoice.CompanyId) ?? _warehouses.FirstOrDefault();
                foreach (var line in invoice.Lines)
                {
                    if (line.ProductId == null) continue;
                    var product = FindProduct(line.ProductId.Value);
                    if (product == null || product.Type != ProductType.Physical) continue;

                    var stockLevel = warehouse != null
                        ? _stockLevels.FirstOrDefault(s => s.ProductId == product.Id && s.WarehouseId == warehouse.Id)
                        : null;

                    if (stockLevel != null && stockLevel.QuantityOnHand >= line.Quantity)
                    {
                        stockLevel.QuantityOnHand -= line.Quantity;
                        product.QuantityOnHand -= line.Quantity;

                        _stockTransactions.Add(new StockTransaction
                        {
                            Date = invoice.InvoiceDate,
                            ProductId = product.Id,
                            WarehouseId = warehouse!.Id,
                            Quantity = line.Quantity,
                            UnitCost = stockLevel.MovingAverageCost,
                            Type = StockTransactionType.Out,
                            Reference = invoice.InvoiceNumber,
                            CompanyId = invoice.CompanyId
                        });
                    }
                }
                invoice.StockReduced = true;
            }

            invoice.Status = SalesInvoiceStatus.Sent;
            invoice.UpdatedAt = DateTime.UtcNow;
            Persist();
            return true;
        }
    }

    public bool UpdateSalesInvoiceStatus(Guid invoiceId, SalesInvoiceStatus status, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var invoice = _salesInvoices.FirstOrDefault(i => i.Id == invoiceId);
            if (invoice == null) { error = "Invoice not found."; return false; }
            invoice.Status = status;
            invoice.UpdatedAt = DateTime.UtcNow;
            Persist();
            return true;
        }
    }

    public bool CreateCompany(CompanyRequest request, out Company? company, out string? error)
    {
        company = null; error = null;
        company = new Company { Name = request.Name.Trim(), Code = request.Code?.Trim(), LegalName = request.LegalName?.Trim(), Type = request.Type, ParentId = request.ParentId, Country = request.Country.Trim(), CurrencyCode = request.CurrencyCode.Trim().ToUpperInvariant(), TaxAuthorityId = request.TaxAuthorityId }; _companies.Add(company); Persist(); return true;
    }
    public bool UpdateCompany(Guid id, CompanyRequest request, out Company? company, out string? error)
    {
        company = _companies.FirstOrDefault(x => x.Id == id); error = null;
        if (company is null) { error = "Entity not found."; return false; }
        company.Name = request.Name.Trim(); company.Code = request.Code?.Trim(); company.LegalName = request.LegalName?.Trim(); company.Type = request.Type; company.ParentId = request.ParentId; company.Country = request.Country.Trim(); company.CurrencyCode = request.CurrencyCode.Trim().ToUpperInvariant(); company.TaxAuthorityId = request.TaxAuthorityId; company.UpdatedAt = DateTime.UtcNow; Persist(); return true;
    }
    public bool SetCompanyStatus(Guid id, bool active, out string? error) { var company = _companies.FirstOrDefault(x => x.Id == id); error = null; if (company is null) { error = "Entity not found."; return false; } company.Active = active; company.UpdatedAt = DateTime.UtcNow; Persist(); return true; }
    
    // Tax Authorities
    public TaxAuthority? FindTaxAuthority(Guid id) => _taxAuthorities.FirstOrDefault(x => x.Id == id);
    public bool CreateTaxAuthority(TaxAuthorityRequest request, out TaxAuthority? authority, out string? error)
    {
        authority = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Name)) { error = "Authority name is required."; return false; }
        lock (_lock)
        {
            authority = new TaxAuthority { Name = request.Name.Trim(), Country = request.Country?.Trim(), State = request.State?.Trim(), RegistrationNumber = request.RegistrationNumber?.Trim(), LiabilityAccountId = request.LiabilityAccountId };
            _taxAuthorities.Add(authority); Persist(); return true;
        }
    }
    public bool UpdateTaxAuthority(Guid id, TaxAuthorityRequest request, out TaxAuthority? authority, out string? error)
    {
        authority = null; error = null;
        lock (_lock)
        {
            authority = FindTaxAuthority(id); if (authority is null) { error = "Authority not found."; return false; }
            authority.Name = request.Name.Trim(); authority.Country = request.Country?.Trim(); authority.State = request.State?.Trim(); authority.RegistrationNumber = request.RegistrationNumber?.Trim(); authority.LiabilityAccountId = request.LiabilityAccountId;
            Persist(); return true;
        }
    }

    // Tax Codes & Rates
    public TaxCode? FindTaxCode(Guid id) => _taxCodes.FirstOrDefault(x => x.Id == id);
    public bool CreateTaxCode(TaxCodeRequest request, out TaxCode? code, out string? error)
    {
        code = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name)) { error = "Code and name are required."; return false; }
        if (FindTaxAuthority(request.TaxAuthorityId) == null) { error = "Invalid tax authority."; return false; }
        
        lock (_lock)
        {
            code = new TaxCode { Code = request.Code.Trim(), Name = request.Name.Trim(), Description = request.Description?.Trim(), TaxAuthorityId = request.TaxAuthorityId, IsActive = request.IsActive };
            foreach (var r in request.Rates)
            {
                var rate = new TaxRate { TaxCodeId = code.Id, Percentage = r.Percentage, EffectiveFrom = r.EffectiveFrom, EffectiveTo = r.EffectiveTo };
                code.Rates.Add(rate);
                _taxRates.Add(rate);
            }
            _taxCodes.Add(code); Persist(); return true;
        }
    }
    public bool UpdateTaxCode(Guid id, TaxCodeRequest request, out TaxCode? code, out string? error)
    {
        code = null; error = null;
        lock (_lock)
        {
            code = FindTaxCode(id); if (code is null) { error = "Tax code not found."; return false; }
            code.Code = request.Code.Trim(); code.Name = request.Name.Trim(); code.Description = request.Description?.Trim(); code.TaxAuthorityId = request.TaxAuthorityId; code.IsActive = request.IsActive;
            
            // For simplicity, replacing all rates on update
            _taxRates.RemoveAll(x => x.TaxCodeId == id);
            code.Rates.Clear();
            foreach (var r in request.Rates)
            {
                var rate = new TaxRate { TaxCodeId = code.Id, Percentage = r.Percentage, EffectiveFrom = r.EffectiveFrom, EffectiveTo = r.EffectiveTo };
                code.Rates.Add(rate);
                _taxRates.Add(rate);
            }
            Persist(); return true;
        }
    }
    
    public Account? Find(Guid id) => _accounts.FirstOrDefault(x => x.Id == id);
    public IEnumerable<AuditItem> History(Guid id) => _history.GetValueOrDefault(id, []);

    public string NextCode(AccountType type) => NextCodeForParent(null, type);

    public string NextCodeForParent(Guid? parentId, AccountType type)
    {
        lock (_lock)
        {
            if (parentId == null)
            {
                var prefix = type switch
                {
                    AccountType.Asset or AccountType.ContraAsset => 1,
                    AccountType.Liability or AccountType.ContraLiability => 2,
                    AccountType.Equity or AccountType.ContraEquity => 3,
                    AccountType.Revenue or AccountType.ContraRevenue => 4,
                    _ => 6
                };
                
                var highestRoot = _accounts
                    .Where(x => x.ParentId == null && x.Code.StartsWith(prefix.ToString()) && x.Code.Length == 5)
                    .Select(x => int.TryParse(x.Code, out var n) ? n : prefix * 10000)
                    .DefaultIfEmpty(prefix * 10000)
                    .Max();
                    
                var next = highestRoot == prefix * 10000 ? prefix * 10000 : highestRoot + 10000;
                if (next >= (prefix + 1) * 10000)
                {
                    next = highestRoot + 1000;
                }
                return next.ToString();
            }

            var parent = Find(parentId.Value);
            if (parent == null) return NextCode(type);

            var children = _accounts.Where(x => x.ParentId == parent.Id).ToList();
            if (children.Count > 0)
            {
                var highestChild = children
                    .Select(x => int.TryParse(x.Code, out var n) ? n : 0)
                    .DefaultIfEmpty(0)
                    .Max();
                if (highestChild > 0)
                {
                    return (highestChild + 1).ToString();
                }
            }

            if (int.TryParse(parent.Code, out var pCode))
            {
                int suggestion;
                if (parent.Code.EndsWith("0000"))
                {
                    suggestion = pCode + 1000;
                }
                else if (parent.Code.EndsWith("000"))
                {
                    suggestion = pCode + 100;
                }
                else if (parent.Code.EndsWith("00"))
                {
                    suggestion = pCode + 1;
                }
                else
                {
                    suggestion = pCode + 1;
                }
                return suggestion.ToString();
            }

            return NextCode(type);
        }
    }

    public Account Create(AccountRequest r)
    {
        lock (_lock)
        {
            Validate(r, null);
            var account = new Account
            {
                Code = string.IsNullOrWhiteSpace(r.Code) ? NextCodeForParent(r.ParentId, r.Type) : r.Code.Trim(),
                Name = r.Name.Trim(),
                Type = r.Type,
                ParentId = r.ParentId,
                OpeningBalance = r.OpeningBalance,
                OpeningBalanceDate = r.OpeningBalanceDate,
                ReconciliationEnabled = r.ReconciliationEnabled,
                IfrsTag = r.IfrsTag,
                GaapTag = r.GaapTag,
                CustomFields = r.CustomFields ?? []
            };
            _accounts.Add(account);
            _history[account.Id] = [new(DateTime.UtcNow, "Created", "Account created")];
            Persist();
            return account;
        }
    }

    public bool Update(Guid id, AccountRequest r, out string? error)
    {
        lock (_lock)
        {
            var a = Find(id);
            if (a is null) { error = "Account not found."; return false; }
            try
            {
                Validate(r, id);
            }
            catch (Exception e)
            {
                error = e.Message;
                return false;
            }
            a.Code = string.IsNullOrWhiteSpace(r.Code) ? a.Code : r.Code.Trim();
            a.Name = r.Name.Trim();
            a.Type = r.Type;
            a.ParentId = r.ParentId;
            a.OpeningBalance = r.OpeningBalance;
            a.OpeningBalanceDate = r.OpeningBalanceDate;
            a.ReconciliationEnabled = r.ReconciliationEnabled;
            a.IfrsTag = r.IfrsTag;
            a.GaapTag = r.GaapTag;
            a.CustomFields = r.CustomFields ?? [];
            a.UpdatedAt = DateTime.UtcNow;
            _history[id].Add(new(DateTime.UtcNow, "Updated", "Account details changed"));
            Persist();
            error = null;
            return true;
        }
    }

    public bool SetStatus(Guid id, StatusRequest status, out string? error) { var a = Find(id); if (a is null) { error = "Account not found."; return false; } a.Status = status.Status; a.UpdatedAt = DateTime.UtcNow; _history[id].Add(new(DateTime.UtcNow, status.Status.ToString(), status.Reason ?? "Status changed")); Persist(); error = null; return true; }
    public bool Delete(Guid id, out string? error) { var a = Find(id); if (a is null) { error = "Account not found."; return false; } if (_accounts.Any(x => x.ParentId == id) || _entries.Any(e => e.Lines.Any(l => l.AccountId == id))) { error = "Accounts with children or transactions cannot be deleted. Deactivate instead."; return false; } _accounts.Remove(a); _history.Remove(id); Persist(); error = null; return true; }
    
    public bool CreateJournal(JournalEntryRequest request, out JournalEntry? entry, out string? error) { entry = null; error = null; if (!ValidateJournal(request, out error)) return false; lock (_lock) { entry = new JournalEntry { Date = request.Date, Reference = request.Reference, Description = request.Description, Lines = request.Lines.Select(l => new JournalLine(l.AccountId, l.Debit, l.Credit, l.Memo, l.Comment, l.CurrencyCode, l.ExchangeRate, l.CompanyId)).ToList(), TransactionType = request.TransactionType, CurrencyCode = request.CurrencyCode, ExchangeRate = request.ExchangeRate, CompanyId = request.CompanyId, CounterpartyCompanyId = request.CounterpartyCompanyId, ReversalDate = request.ReversalDate, AutoReverse = request.AutoReverse }; _entries.Add(entry); AddEvent(entry, "on_create", "system", "Journal entry created as draft"); Persist(); return true; } }
    public bool Transition(Guid id, JournalStatus target, TransitionRequest request, out JournalEntry? entry, out string? error) { lock (_lock) { entry = FindEntry(id); error = null; if (entry is null) { error = "Journal entry not found."; return false; } entry.Status = target; entry.Version++; AddEvent(entry, "on_status_change", "system", request.Note ?? $"Journal entry {target.ToString().ToLowerInvariant()}"); Persist(); return true; } }
    public bool BatchPost(BatchPostRequest request, out object result, out string? error) { lock (_lock) { var selected = request.EntryIds.Select(FindEntry).Where(x => x != null).ToList(); foreach (var item in selected!) { item!.Status = JournalStatus.Posted; item.Version++; AddEvent(item, "on_post", "system", "Posted by batch"); } Persist(); result = new { posted = selected.Count }; error = null; return true; } }
    public JournalEntry? FindEntry(Guid id) => _entries.FirstOrDefault(x => x.Id == id);
    public IEnumerable<JournalEvent> Events(Guid id) => _journalEvents.Where(x => x.JournalEntryId == id).OrderByDescending(x => x.OccurredAt);
    public void AddAttachment(Guid id, AttachmentRequest attachment) { var entry = FindEntry(id) ?? throw new KeyNotFoundException(); entry.Attachments.Add(new Attachment(attachment.FileName, attachment.ContentType, attachment.Url, DateTime.UtcNow)); AddEvent(entry, "attachment_added", "system", attachment.FileName); Persist(); }
    public RecurringJournalEntry AddRecurring(RecurringEntryRequest request) { var recurring = new RecurringJournalEntry { Entry = request.Entry, Frequency = request.Frequency, StartsOn = request.StartsOn, EndsOn = request.EndsOn }; _recurringEntries.Add(recurring); Persist(); return recurring; }
    public JournalTemplate AddTemplate(JournalTemplateRequest request) { var template = new JournalTemplate { Name = request.Name, Description = request.Description, TransactionType = request.TransactionType, CurrencyCode = request.CurrencyCode, Lines = request.Lines }; _templates.Add(template); Persist(); return template; }
    public bool CreateIntercompanyAllocation(IntercompanyAllocationRequest request, out IntercompanyAllocation? allocation, out string? error) { allocation = new IntercompanyAllocation { Name = request.Name.Trim(), SourceCompanyId = request.SourceCompanyId, Category = request.Category.Trim(), Description = request.Description?.Trim(), Frequency = request.Frequency, Rate = request.Rate, Quantity = request.Quantity, StartDate = request.StartDate, EndDate = request.EndDate, Recipients = request.Recipients }; _intercompanyAllocations.Add(allocation); Persist(); error = null; return true; }
    public bool SetIntercompanyStatus(Guid id, IntercompanyAllocationStatus status, out string? error) { var allocation = _intercompanyAllocations.FirstOrDefault(x => x.Id == id); if (allocation is null) { error = "Intercompany allocation not found."; return false; } allocation.Status = status; allocation.UpdatedAt = DateTime.UtcNow; Persist(); error = null; return true; }
    
    private bool ValidateJournal(JournalEntryRequest request, out string? error) { error = null; if (request.Lines.Count < 2) { error = "A journal entry requires at least two lines."; return false; } return true; }
    private void AddEvent(JournalEntry entry, string eventType, string actor, string detail) => _journalEvents.Add(new JournalEvent(Guid.NewGuid(), entry.Id, eventType, DateTime.UtcNow, actor, detail, entry.Version));
    
    private bool LoadState()
    {
        if (_dbFactory is null) return false;
        using var db = _dbFactory.CreateDbContext();
        db.Database.EnsureCreated();
        var snapshot = db.AccountingStateSnapshots.Find(1);
        if (snapshot is null) return false;
        var state = JsonSerializer.Deserialize<StoredState>(snapshot.Json);
        if (state is null) return false;
        
        // Migrate 4-digit codes to 5-digit codes if any exist in the saved snapshot
        if (state.Accounts != null)
        {
            foreach (var account in state.Accounts)
            {
                if (account.Code.Length == 4 && int.TryParse(account.Code, out var num))
                {
                    account.Code = (num * 10).ToString();
                }
                
                // Clear the default legacy 28,450.00 opening balance
                if ((account.Code == "11100" || account.Code == "1110" || account.Code == "11100") && account.OpeningBalance == 28450m)
                {
                    account.OpeningBalance = 0m;
                }
            }
        }
        
        // Reset accounts to the new beautiful tree hierarchy if there are no posted entries yet
        if (state.Accounts != null && (state.Entries == null || state.Entries.Count == 0))
        {
            state.Accounts.Clear();
            _accounts.Clear();
            _history.Clear();
            SeedAccounts();
            state.Accounts.AddRange(_accounts);
        }

        _accounts.Clear(); _accounts.AddRange(state.Accounts);
        _entries.Clear(); _entries.AddRange(state.Entries);
        _templates.Clear(); _templates.AddRange(state.Templates);
        _recurringEntries.Clear(); _recurringEntries.AddRange(state.RecurringEntries);
        _journalEvents.Clear(); _journalEvents.AddRange(state.Events);
        _intercompanyAllocations.Clear(); _intercompanyAllocations.AddRange(state.IntercompanyAllocations ?? []);
        _companies.Clear(); _companies.AddRange(state.Companies ?? [new Company { Name = "Acme Holdings", Code = "ACME", Type = EntityType.Parent }, new Company { Name = "Acme Services", Code = "ASV" }, new Company { Name = "Acme Trading", Code = "ATD" }]);
        _customers.Clear(); _customers.AddRange(state.Customers ?? []);
        _products.Clear(); _products.AddRange(state.Products ?? []);
        _vendors.Clear(); _vendors.AddRange(state.Vendors ?? []);
        _purchaseOrders.Clear(); _purchaseOrders.AddRange(state.PurchaseOrders ?? []);
        _grns.Clear(); _grns.AddRange(state.Grns ?? []);
        _fixedAssets.Clear(); _fixedAssets.AddRange(state.FixedAssets ?? []);
        _taxAuthorities.Clear(); _taxAuthorities.AddRange(state.TaxAuthorities ?? []);
        _taxCodes.Clear(); _taxCodes.AddRange(state.TaxCodes ?? []);
        _taxRates.Clear(); _taxRates.AddRange(state.TaxRates ?? []);
        _warehouses.Clear(); _warehouses.AddRange(state.Warehouses ?? []);
        _stockLevels.Clear(); _stockLevels.AddRange(state.StockLevels ?? []);
        _stockTransactions.Clear(); _stockTransactions.AddRange(state.StockTransactions ?? []);
        _salesInvoices.Clear(); _salesInvoices.AddRange(state.SalesInvoices ?? []);
        _estimates.Clear(); _estimates.AddRange(state.Estimates ?? []);
        foreach (var (id, history) in state.History) _history[id] = history;
        Persist();
        return true;
    }
    private void Persist()
    {
        if (_dbFactory is null) return;
        using var db = _dbFactory.CreateDbContext();
        var json = JsonSerializer.Serialize(new StoredState(_accounts, _entries, _history, _templates, _recurringEntries, _journalEvents, _intercompanyAllocations, _companies, _customers, _products, _vendors, _purchaseOrders, _grns, _fixedAssets, _taxAuthorities, _taxCodes, _taxRates, _warehouses, _stockLevels, _stockTransactions, _salesInvoices, _estimates));
        var snapshot = db.AccountingStateSnapshots.Find(1);
        if (snapshot is null) db.AccountingStateSnapshots.Add(new AccountingStateSnapshot { Id = 1, Json = json, UpdatedAt = DateTime.UtcNow });
        else { snapshot.Json = json; snapshot.UpdatedAt = DateTime.UtcNow; }
        db.SaveChanges();
    }
    private void Validate(AccountRequest r, Guid? editing)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) 
            throw new InvalidOperationException("Account name is required.");
            
        var code = r.Code?.Trim();
        if (string.IsNullOrWhiteSpace(code))
            throw new InvalidOperationException("Account code is required.");
            
        if (code.Length != 5 || !code.All(char.IsDigit))
            throw new InvalidOperationException("Account code must contain exactly 5 numeric digits without letters or special characters.");
            
        if (_accounts.Any(a => a.Id != editing && a.Code.Equals(code, StringComparison.OrdinalIgnoreCase))) 
            throw new InvalidOperationException($"Account code '{code}' already exists. Account codes must be unique.");
    }
}
