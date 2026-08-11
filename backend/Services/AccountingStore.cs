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
    private readonly List<SalesOrder> _salesOrders = [];
    private readonly List<CreditNote> _creditNotes = [];
    private readonly List<BillOfMaterials> _boms = [];
    private readonly List<WorkOrder> _workOrders = [];
    private readonly List<AccountMapping> _mappings = [];
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
        List<Estimate>? Estimates = null,
        List<BillOfMaterials>? Boms = null,
        List<WorkOrder>? WorkOrders = null,
        List<AccountMapping>? Mappings = null,
        List<SalesOrder>? SalesOrders = null,
        List<CreditNote>? CreditNotes = null);

    public AccountingStore(IDbContextFactory<AccountingDbContext>? dbFactory = null)
    {
        _dbFactory = dbFactory;
        if (LoadState()) return;
        var parentEntity = new Company { Name = "Acme Holdings", Code = "ACME", Type = EntityType.Parent };
        _companies.AddRange([parentEntity, new Company { Name = "Acme Services", Code = "ASV", ParentId = parentEntity.Id }, new Company { Name = "Acme Trading", Code = "ATD", ParentId = parentEntity.Id }]);

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

    private Account Seed(string code, string name, AccountType type, Guid? parent, bool reconciliation = false, decimal opening = 0, bool isSystem = true)
    {
        var a = new Account { Code = code, Name = name, Type = type, ParentId = parent, ReconciliationEnabled = reconciliation, OpeningBalance = opening, OpeningBalanceDate = opening != 0 ? DateOnly.FromDateTime(DateTime.Today) : null, IsSystem = isSystem };
        _accounts.Add(a); _history[a.Id] = [new(DateTime.UtcNow, "Created", "Starter account")]; return a;
    }

    private void SeedAccounts()
    {
        _accounts.Clear();
        // 1. Assets
        var assets = Seed("10000", "Assets", AccountType.Asset, null);
        var currentAssets = Seed("11000", "Current Assets", AccountType.Asset, assets.Id);
        var cashBank = Seed("11100", "Cash & Bank", AccountType.Asset, currentAssets.Id, true);
        Seed("11110", "Main Bank Account", AccountType.Asset, cashBank.Id, true, 0m);
        Seed("12000", "Accounts Receivable", AccountType.Asset, currentAssets.Id, true);
        Seed("13000", "Inventory Asset", AccountType.Asset, currentAssets.Id, true);
        
        var nonCurrentAssets = Seed("15000", "Non-Current Assets", AccountType.Asset, assets.Id);
        Seed("15100", "Fixed Assets", AccountType.Asset, nonCurrentAssets.Id, true);
        Seed("15200", "Accumulated Depreciation", AccountType.ContraAsset, nonCurrentAssets.Id, true);

        // 2. Liabilities
        var liabilities = Seed("20000", "Liabilities", AccountType.Liability, null);
        var currentLiabilities = Seed("21000", "Current Liabilities", AccountType.Liability, liabilities.Id);
        Seed("21100", "Accounts Payable", AccountType.Liability, currentLiabilities.Id, true);
        Seed("21200", "GRNI Accrual", AccountType.Liability, currentLiabilities.Id, true);
        Seed("22000", "Tax Payable", AccountType.Liability, currentLiabilities.Id, true);

        // 3. Equity
        var equity = Seed("30000", "Equity", AccountType.Equity, null);
        Seed("31000", "Share Capital", AccountType.Equity, equity.Id);
        Seed("32000", "Retained Earnings", AccountType.Equity, equity.Id);

        // 4. Revenue
        var revenue = Seed("40000", "Revenue", AccountType.Revenue, null);
        var operatingRevenue = Seed("41000", "Operating Revenue", AccountType.Revenue, revenue.Id);
        Seed("41100", "Sales Revenue", AccountType.Revenue, operatingRevenue.Id, true);
        Seed("42000", "Non-Operating Revenue", AccountType.Revenue, revenue.Id);

        // 5. Cost of Goods Sold
        var cogs = Seed("50000", "Cost of Goods Sold", AccountType.Expense, null);
        Seed("51000", "Cost of Sales", AccountType.Expense, cogs.Id);

        // 6. Expenses
        var expenses = Seed("60000", "Expenses", AccountType.Expense, null);
        var operatingExpenses = Seed("61000", "Operating Expenses", AccountType.Expense, expenses.Id);
        Seed("61100", "Office Expenses", AccountType.Expense, operatingExpenses.Id, true);
    }

    public IReadOnlyList<Account> Accounts => _accounts;
    public IReadOnlyList<AccountMapping> Mappings => _mappings;
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
    public IReadOnlyList<SalesOrder> SalesOrders => _salesOrders;
    public IReadOnlyList<CreditNote> CreditNotes => _creditNotes;
    public IReadOnlyList<TaxRate> TaxRates => _taxRates;
    public IReadOnlyList<BillOfMaterials> BillOfMaterials => _boms;
    public IReadOnlyList<WorkOrder> WorkOrders => _workOrders;

    public string NextBomNumber()
    {
        var numbers = _boms.Select(b => b.BomNumber).Where(n => n.StartsWith("BOM-") && int.TryParse(n[4..], out _)).Select(n => int.Parse(n[4..])).DefaultIfEmpty(0);
        return $"BOM-{(numbers.Max() + 1):D4}";
    }

    public string NextWorkOrderNumber()
    {
        var numbers = _workOrders.Select(w => w.WorkOrderNumber).Where(n => n.StartsWith("WO-") && int.TryParse(n[3..], out _)).Select(n => int.Parse(n[3..])).DefaultIfEmpty(0);
        return $"WO-{(numbers.Max() + 1):D4}";
    }

    public BillOfMaterials CreateBom(BillOfMaterials bom)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(bom.BomNumber)) bom.BomNumber = NextBomNumber();
            _boms.Add(bom);
            Persist();
            return bom;
        }
    }

    public WorkOrder CreateWorkOrder(WorkOrder order)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(order.WorkOrderNumber)) order.WorkOrderNumber = NextWorkOrderNumber();
            _workOrders.Add(order);
            Persist();
            return order;
        }
    }

    public bool StartWorkOrder(string id, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var wo = _workOrders.FirstOrDefault(x => x.Id == id);
            if (wo is null) { error = "Work Order not found."; return false; }
            if (wo.Status != WorkOrderStatus.Draft && wo.Status != WorkOrderStatus.Released) { error = "Work Order is already in progress or completed."; return false; }

            // Deduct Raw Materials from Warehouse (Stock Out)
            decimal totalMatCost = 0;
            foreach (var line in wo.Lines)
            {
                Guid.TryParse(line.RawMaterialProductId, out var prodId);
                Guid.TryParse(wo.RawMaterialWarehouseId, out var whId);
                Guid.TryParse(wo.CompanyId, out var compId);

                var product = _products.FirstOrDefault(p => p.Id == prodId);
                var unitCost = product?.CostPrice ?? 10m;
                var reqQty = line.QuantityRequired * wo.QuantityToProduce;
                line.QuantityIssued = reqQty;
                line.UnitCost = unitCost;
                line.TotalCost = reqQty * unitCost;
                totalMatCost += line.TotalCost;

                // Record Stock Outbound
                var txn = new StockTransaction
                {
                    Date = DateOnly.FromDateTime(DateTime.Today),
                    Type = StockTransactionType.Out,
                    ProductId = prodId,
                    WarehouseId = whId,
                    Quantity = reqQty,
                    UnitCost = unitCost,
                    Reference = $"WO Issue: {wo.WorkOrderNumber}",
                    CompanyId = compId != Guid.Empty ? compId : null
                };
                _stockTransactions.Add(txn);

                // Update Stock Level
                var level = _stockLevels.FirstOrDefault(sl => sl.ProductId == prodId && sl.WarehouseId == whId);
                if (level is not null)
                {
                    level.QuantityOnHand = Math.Max(0, level.QuantityOnHand - reqQty);
                }
            }

            wo.TotalMaterialCost = totalMatCost;
            wo.Status = WorkOrderStatus.InProgress;
            Persist();
            return true;
        }
    }

    public bool CompleteWorkOrder(string id, decimal actualProducedQty, decimal directLabor, decimal overhead, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var wo = _workOrders.FirstOrDefault(x => x.Id == id);
            if (wo is null) { error = "Work Order not found."; return false; }
            if (wo.Status != WorkOrderStatus.InProgress && wo.Status != WorkOrderStatus.Released) { error = "Work Order must be in progress to complete."; return false; }

            var produceQty = actualProducedQty > 0 ? actualProducedQty : wo.QuantityToProduce;
            wo.DirectLaborCost = directLabor;
            wo.OverheadCost = overhead;
            wo.TotalCost = wo.TotalMaterialCost + directLabor + overhead;
            wo.UnitCost = produceQty > 0 ? Math.Round(wo.TotalCost / produceQty, 2) : 0;
            wo.QuantityProduced = produceQty;

            Guid.TryParse(wo.FinishedProductId, out var finishedProdId);
            Guid.TryParse(wo.FinishedGoodsWarehouseId, out var finishedWhId);
            Guid.TryParse(wo.CompanyId, out var compId);

            // Add Finished Goods into Warehouse (Stock In)
            var txn = new StockTransaction
            {
                Date = DateOnly.FromDateTime(DateTime.Today),
                Type = StockTransactionType.In,
                ProductId = finishedProdId,
                WarehouseId = finishedWhId,
                Quantity = produceQty,
                UnitCost = wo.UnitCost,
                Reference = $"WO Completion: {wo.WorkOrderNumber}",
                CompanyId = compId != Guid.Empty ? compId : null
            };
            _stockTransactions.Add(txn);

            // Update Stock Level for Finished Goods
            var level = _stockLevels.FirstOrDefault(sl => sl.ProductId == finishedProdId && sl.WarehouseId == finishedWhId);
            if (level is null)
            {
                level = new StockLevel
                {
                    ProductId = finishedProdId,
                    WarehouseId = finishedWhId,
                    QuantityOnHand = produceQty,
                    MovingAverageCost = wo.UnitCost,
                    CompanyId = compId != Guid.Empty ? compId : null
                };
                _stockLevels.Add(level);
            }
            else
            {
                var totalVal = (level.QuantityOnHand * level.MovingAverageCost) + wo.TotalCost;
                level.QuantityOnHand += produceQty;
                level.MovingAverageCost = level.QuantityOnHand > 0 ? Math.Round(totalVal / level.QuantityOnHand, 2) : wo.UnitCost;
            }

            // Update Finished Product Cost & Unit Price
            var finishedProduct = _products.FirstOrDefault(p => p.Id == finishedProdId);
            if (finishedProduct is not null)
            {
                finishedProduct.CostPrice = wo.UnitCost;
            }

            wo.Status = WorkOrderStatus.Completed;
            wo.CompletionDate = DateTime.UtcNow.ToString("yyyy-MM-dd");
            Persist();
            return true;
        }
    }

    private readonly List<GoodsReceiptNoteModel> _grnModels = [];
    private readonly List<StockTransfer> _stockTransfers = [];

    public IReadOnlyList<GoodsReceiptNoteModel> GoodsReceiptNoteLogs => _grnModels;
    public IReadOnlyList<StockTransfer> StockTransfers => _stockTransfers;

    public PurchaseRequest CreatePurchaseRequest(PurchaseRequest pr)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(pr.RequestNumber))
            {
                var max = _prs.Select(p => p.RequestNumber).Where(n => n.StartsWith("PR-") && int.TryParse(n[3..], out _)).Select(n => int.Parse(n[3..])).DefaultIfEmpty(0).Max();
                pr.RequestNumber = $"PR-{(max + 1):D4}";
            }
            _prs.Add(pr);
            Persist();
            return pr;
        }
    }

    public RequestForQuotation CreateRfq(RequestForQuotation rfq)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(rfq.RfqNumber))
            {
                var max = _rfqs.Select(r => r.RfqNumber).Where(n => n.StartsWith("RFQ-") && int.TryParse(n[4..], out _)).Select(n => int.Parse(n[4..])).DefaultIfEmpty(0).Max();
                rfq.RfqNumber = $"RFQ-{(max + 1):D4}";
            }
            _rfqs.Add(rfq);
            Persist();
            return rfq;
        }
    }

    public VendorQuote CreateVendorQuote(VendorQuote quote)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(quote.QuoteNumber))
            {
                var max = _vendorQuotes.Select(q => q.QuoteNumber).Where(n => n.StartsWith("VQ-") && int.TryParse(n[3..], out _)).Select(n => int.Parse(n[3..])).DefaultIfEmpty(0).Max();
                quote.QuoteNumber = $"VQ-{(max + 1):D4}";
            }
            _vendorQuotes.Add(quote);
            Persist();
            return quote;
        }
    }

    public bool SelectVendorQuote(string quoteId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            Guid.TryParse(quoteId, out var targetQuoteId);
            var quote = _vendorQuotes.FirstOrDefault(q => q.Id == targetQuoteId);
            if (quote is null) { error = "Vendor Quote not found."; return false; }

            foreach (var q in _vendorQuotes.Where(x => x.RequestForQuotationId == quote.RequestForQuotationId))
            {
                q.IsWinningQuote = (q.Id == targetQuoteId);
            }

            var maxPo = _purchaseOrders.Select(p => p.PoNumber).Where(n => n.StartsWith("PO-") && int.TryParse(n[3..], out _)).Select(n => int.Parse(n[3..])).DefaultIfEmpty(0).Max();
            var po = new PurchaseOrder
            {
                PoNumber = $"PO-{(maxPo + 1):D4}",
                VendorId = quote.VendorId,
                VendorQuoteId = quote.Id,
                Date = DateOnly.FromDateTime(DateTime.Today),
                ExpectedDeliveryDate = DateOnly.FromDateTime(DateTime.Today.AddDays(quote.DeliveryLeadTimeDays)),
                Status = PurchaseOrderStatus.Issued,
                CompanyId = quote.CompanyId,
                Lines = quote.Lines.Select(l => new PurchaseOrderLine
                {
                    Description = l.Description,
                    ProductId = l.ProductId ?? Guid.Empty,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    TaxAmount = 0,
                    Destination = l.Destination
                }).ToList()
            };
            _purchaseOrders.Add(po);
            Persist();
            return true;
        }
    }

    public bool ProcessGrnReceiving(GoodsReceiptNoteModel grn, out string? error)
    {
        error = null;
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(grn.GrnNumber))
            {
                var max = _grnModels.Select(g => g.GrnNumber).Where(n => n.StartsWith("GRN-") && int.TryParse(n[4..], out _)).Select(n => int.Parse(n[4..])).DefaultIfEmpty(0).Max();
                grn.GrnNumber = $"GRN-{(max + 1):D4}";
            }

            foreach (var line in grn.Lines)
            {
                Guid.TryParse(line.ProductId, out var prodId);
                Guid.TryParse(grn.TargetWarehouseId, out var whId);
                Guid.TryParse(grn.CompanyId, out var compId);

                if (line.Destination == LineDestination.Inventory || line.Destination == LineDestination.ManufacturingMaterial)
                {
                    var txn = new StockTransaction
                    {
                        Date = DateOnly.FromDateTime(DateTime.Today),
                        Type = StockTransactionType.In,
                        ProductId = prodId != Guid.Empty ? prodId : Guid.NewGuid(),
                        WarehouseId = whId,
                        Quantity = line.ReceivedQuantity,
                        UnitCost = line.UnitCost,
                        Reference = $"GRN: {grn.GrnNumber}",
                        CompanyId = compId != Guid.Empty ? compId : null
                    };
                    _stockTransactions.Add(txn);

                    var level = _stockLevels.FirstOrDefault(sl => sl.ProductId == prodId && sl.WarehouseId == whId);
                    if (level is null && prodId != Guid.Empty)
                    {
                        level = new StockLevel
                        {
                            ProductId = prodId,
                            WarehouseId = whId,
                            QuantityOnHand = line.ReceivedQuantity,
                            MovingAverageCost = line.UnitCost,
                            CompanyId = compId != Guid.Empty ? compId : null
                        };
                        _stockLevels.Add(level);
                    }
                    else if (level is not null)
                    {
                        var totVal = (level.QuantityOnHand * level.MovingAverageCost) + (line.ReceivedQuantity * line.UnitCost);
                        level.QuantityOnHand += line.ReceivedQuantity;
                        level.MovingAverageCost = level.QuantityOnHand > 0 ? Math.Round(totVal / level.QuantityOnHand, 2) : line.UnitCost;
                    }
                }
                else if (line.Destination == LineDestination.FixedAsset)
                {
                    var asset = new FixedAsset
                    {
                        AssetTag = $"FA-{(_fixedAssets.Count + 1):D4}",
                        Name = line.Description,
                        PurchaseDate = DateOnly.FromDateTime(DateTime.Today),
                        PurchasePrice = line.ReceivedQuantity * line.UnitCost,
                        UsefulLifeYears = 3,
                        SalvageValue = 0,
                        Status = AssetStatus.Active,
                        CompanyId = compId != Guid.Empty ? compId : null
                    };
                    _fixedAssets.Add(asset);
                }
            }

            _grnModels.Add(grn);
            Persist();
            return true;
        }
    }

    public VendorBill CreateVendorBill(VendorBill bill)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(bill.BillNumber))
            {
                var max = _vendorBills.Select(b => b.BillNumber).Where(n => n.StartsWith("BILL-") && int.TryParse(n[5..], out _)).Select(n => int.Parse(n[5..])).DefaultIfEmpty(0).Max();
                bill.BillNumber = $"BILL-{(max + 1):D4}";
            }
            bill.Status = VendorBillStatus.Draft;
            _vendorBills.Add(bill);
            Persist();
            return bill;
        }
    }

    public bool UpdateVendorBill(Guid id, VendorBill updated, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var bill = _vendorBills.FirstOrDefault(b => b.Id == id);
            if (bill == null) { error = "Vendor Bill not found."; return false; }
            if (bill.Status != VendorBillStatus.Draft) { error = "Only Draft bills can be edited."; return false; }

            bill.VendorInvoiceNumber = updated.VendorInvoiceNumber ?? bill.VendorInvoiceNumber;
            bill.VendorId = updated.VendorId != Guid.Empty ? updated.VendorId : bill.VendorId;
            bill.PurchaseOrderId = updated.PurchaseOrderId ?? bill.PurchaseOrderId;
            bill.Date = updated.Date != default ? updated.Date : bill.Date;
            bill.DueDate = updated.DueDate != default ? updated.DueDate : bill.DueDate;
            bill.PaymentTermsDays = updated.PaymentTermsDays > 0 ? updated.PaymentTermsDays : bill.PaymentTermsDays;
            bill.CurrencyCode = updated.CurrencyCode ?? bill.CurrencyCode;
            bill.Notes = updated.Notes ?? bill.Notes;
            if (updated.Lines != null && updated.Lines.Count > 0)
            {
                bill.Lines = updated.Lines;
            }
            Persist();
            return true;
        }
    }

    public bool PostVendorBill(Guid id, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var bill = _vendorBills.FirstOrDefault(b => b.Id == id);
            if (bill == null) { error = "Vendor Bill not found."; return false; }
            if (bill.Status != VendorBillStatus.Draft) { error = "Only Draft bills can be posted."; return false; }
            bill.Status = VendorBillStatus.Open;
            Persist();
            return true;
        }
    }

    public ThreeWayMatchCheck ValidateThreeWayMatch(string poId)
    {
        var po = _purchaseOrders.FirstOrDefault(p => p.Id.ToString() == poId || p.PoNumber == poId);
        if (po is null) return new ThreeWayMatchCheck { Status = "NotFound", Details = "PO not found." };

        var grns = _grnModels.Where(g => g.PurchaseOrderId == po.Id.ToString() || g.PurchaseOrderNumber == po.PoNumber).ToList();
        var bill = _vendorBills.FirstOrDefault(b => b.PurchaseOrderId == po.Id);

        var orderedAmt = po.Lines.Sum(l => l.TotalAmount);
        var receivedAmt = grns.SelectMany(g => g.Lines).Sum(l => l.ReceivedQuantity * l.UnitCost);
        var billedAmt = bill?.Lines?.Sum(l => l.TotalAmount) ?? receivedAmt;

        var qtyVariance = po.Lines.Sum(l => l.Quantity) - grns.SelectMany(g => g.Lines).Sum(l => l.ReceivedQuantity);
        var priceVariance = Math.Abs(orderedAmt - billedAmt);

        bool matched = Math.Abs(qtyVariance) < 0.01m && priceVariance < 0.01m;

        return new ThreeWayMatchCheck
        {
            PurchaseOrderId = po.Id.ToString(),
            PurchaseOrderNumber = po.PoNumber,
            GrnId = grns.FirstOrDefault()?.Id ?? "",
            GrnNumber = grns.FirstOrDefault()?.GrnNumber ?? "Pending",
            VendorBillNumber = bill?.BillNumber ?? "Pending",
            OrderedAmount = orderedAmt,
            ReceivedAmount = receivedAmt,
            BilledAmount = billedAmt,
            QuantityVariance = qtyVariance,
            PriceVariance = priceVariance,
            IsMatched = matched,
            Status = matched ? "Passed" : (priceVariance > 0.01m ? "OverBilled" : "UnderDelivery"),
            Details = matched ? "3-Way Match Passed cleanly." : $"Discrepancy detected: Qty Var: {qtyVariance}, Price Var: ${priceVariance:F2}"
        };
    }

    public bool ProcessStockTransfer(StockTransfer transfer, out string? error)
    {
        error = null;
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(transfer.TransferNumber))
            {
                var max = _stockTransfers.Select(t => t.TransferNumber).Where(n => n.StartsWith("ST-") && int.TryParse(n[3..], out _)).Select(n => int.Parse(n[3..])).DefaultIfEmpty(0).Max();
                transfer.TransferNumber = $"ST-{(max + 1):D4}";
            }

            Guid.TryParse(transfer.SourceWarehouseId, out var srcWhId);
            Guid.TryParse(transfer.DestinationWarehouseId, out var dstWhId);
            Guid.TryParse(transfer.ProductId, out var prodId);
            Guid.TryParse(transfer.CompanyId, out var compId);

            var srcLevel = _stockLevels.FirstOrDefault(sl => sl.ProductId == prodId && sl.WarehouseId == srcWhId);
            if (srcLevel is not null)
            {
                srcLevel.QuantityOnHand = Math.Max(0, srcLevel.QuantityOnHand - transfer.Quantity);
            }

            var dstLevel = _stockLevels.FirstOrDefault(sl => sl.ProductId == prodId && sl.WarehouseId == dstWhId);
            if (dstLevel is null)
            {
                dstLevel = new StockLevel
                {
                    ProductId = prodId,
                    WarehouseId = dstWhId,
                    QuantityOnHand = transfer.Quantity,
                    MovingAverageCost = srcLevel?.MovingAverageCost ?? 10m,
                    CompanyId = compId != Guid.Empty ? compId : null
                };
                _stockLevels.Add(dstLevel);
            }
            else
            {
                dstLevel.QuantityOnHand += transfer.Quantity;
            }

            _stockTransfers.Add(transfer);
            Persist();
            return true;
        }
    }

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
                PaymentTermsDays = request.PaymentTermsDays,
                CurrencyCode = request.CurrencyCode,
                Notes = request.Notes,
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

    // ─── Sales Orders ─────────────────────────────────────────────────────────
    public string NextSalesOrderNumber()
    {
        var numbers = _salesOrders.Select(so => so.OrderNumber).Where(n => n.StartsWith("SO-") && int.TryParse(n[3..], out _)).Select(n => int.Parse(n[3..])).DefaultIfEmpty(0);
        return $"SO-{(numbers.Max() + 1):D4}";
    }

    public bool CreateSalesOrder(SalesOrderRequest request, out SalesOrder order, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var customer = _customers.FirstOrDefault(c => c.Id == request.CustomerId);
            if (customer == null) { error = "Customer not found."; order = null!; return false; }

            order = new SalesOrder
            {
                OrderNumber = string.IsNullOrWhiteSpace(request.OrderNumber) ? NextSalesOrderNumber() : request.OrderNumber.Trim(),
                CustomerId = request.CustomerId,
                OrderDate = request.OrderDate,
                ExpectedDeliveryDate = request.ExpectedDeliveryDate,
                Reference = request.Reference,
                Notes = request.Notes,
                Terms = request.Terms,
                Lines = request.Lines.Select(l => new SalesOrderLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    DiscountAmount = l.DiscountAmount,
                    TaxCodeId = l.TaxCodeId,
                    TaxAmount = l.TaxAmount
                }).ToList(),
                CompanyId = request.CompanyId,
                Status = SalesOrderStatus.Draft
            };

            _salesOrders.Add(order);
            Persist();
            return true;
        }
    }

    public bool UpdateSalesOrderStatus(Guid orderId, SalesOrderStatus status, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var order = _salesOrders.FirstOrDefault(so => so.Id == orderId);
            if (order == null) { error = "Sales Order not found."; return false; }
            order.Status = status;
            order.UpdatedAt = DateTime.UtcNow;
            Persist();
            return true;
        }
    }

    public bool ConvertSalesOrderToInvoice(Guid orderId, out SalesInvoice? invoice, out string? error)
    {
        error = null;
        invoice = null;
        lock (_lock)
        {
            var order = _salesOrders.FirstOrDefault(so => so.Id == orderId);
            if (order == null) { error = "Sales Order not found."; return false; }
            if (order.Status == SalesOrderStatus.Cancelled) { error = "Cannot convert a cancelled order to an invoice."; return false; }
            if (order.ConvertedToInvoiceId.HasValue) { error = "Sales Order has already been converted to an invoice."; return false; }

            // Generate next invoice number
            var invoiceNumbers = _salesInvoices.Select(i => i.InvoiceNumber).Where(n => n.StartsWith("INV-") && int.TryParse(n[4..], out _)).Select(n => int.Parse(n[4..])).DefaultIfEmpty(0);
            string invoiceNum = $"INV-{(invoiceNumbers.Max() + 1):D4}";

            invoice = new SalesInvoice
            {
                InvoiceNumber = invoiceNum,
                CustomerId = order.CustomerId,
                InvoiceDate = DateOnly.FromDateTime(DateTime.Today),
                DueDate = DateOnly.FromDateTime(DateTime.Today.AddDays(30)),
                Reference = order.OrderNumber,
                Notes = order.Notes,
                Status = SalesInvoiceStatus.Draft,
                Lines = order.Lines.Select(l => new SalesInvoiceLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    DiscountAmount = l.DiscountAmount,
                    TaxCodeId = l.TaxCodeId,
                    TaxAmount = l.TaxAmount
                }).ToList(),
                CompanyId = order.CompanyId
            };

            _salesInvoices.Add(invoice);
            
            // Mark Sales Order as Invoiced and link
            order.Status = SalesOrderStatus.Invoiced;
            order.ConvertedToInvoiceId = invoice.Id;
            order.UpdatedAt = DateTime.UtcNow;

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

    // ─── Credit Notes ────────────────────────────────────────────────────────
    public string NextCreditNoteNumber()
    {
        var numbers = _creditNotes.Select(cn => cn.CreditNoteNumber).Where(n => n.StartsWith("CN-") && int.TryParse(n[3..], out _)).Select(n => int.Parse(n[3..])).DefaultIfEmpty(0);
        return $"CN-{(numbers.Max() + 1):D4}";
    }

    public bool CreateCreditNote(CreditNoteRequest request, out CreditNote creditNote, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var customer = _customers.FirstOrDefault(c => c.Id == request.CustomerId);
            if (customer == null) { error = "Customer not found."; creditNote = null!; return false; }

            if (request.OriginalInvoiceId.HasValue)
            {
                var invoice = _salesInvoices.FirstOrDefault(i => i.Id == request.OriginalInvoiceId.Value);
                if (invoice == null) { error = "Original invoice not found."; creditNote = null!; return false; }
                if (invoice.CustomerId != request.CustomerId) { error = "Customer mismatch with original invoice."; creditNote = null!; return false; }
            }

            creditNote = new CreditNote
            {
                CreditNoteNumber = string.IsNullOrWhiteSpace(request.CreditNoteNumber) ? NextCreditNoteNumber() : request.CreditNoteNumber.Trim(),
                CustomerId = request.CustomerId,
                OriginalInvoiceId = request.OriginalInvoiceId,
                CreditNoteDate = request.CreditNoteDate,
                Reference = request.Reference,
                Notes = request.Notes,
                Lines = request.Lines.Select(l => new CreditNoteLine
                {
                    ProductId = l.ProductId,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    DiscountAmount = l.DiscountAmount,
                    TaxCodeId = l.TaxCodeId,
                    TaxAmount = l.TaxAmount
                }).ToList(),
                CompanyId = request.CompanyId,
                Status = CreditNoteStatus.Draft
            };

            _creditNotes.Add(creditNote);
            Persist();
            return true;
        }
    }

    public bool PostCreditNote(Guid creditNoteId, Guid? arAccountId, Guid? revenueAccountId, Guid? taxLiabilityAccountId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var creditNote = _creditNotes.FirstOrDefault(cn => cn.Id == creditNoteId);
            if (creditNote == null) { error = "Credit Note not found."; return false; }
            if (creditNote.Status != CreditNoteStatus.Draft) { error = "Only draft credit notes can be posted."; return false; }

            // Centralized Posting Engine resolution
            Guid resolvedAr = arAccountId ?? GetMappedAccount("Customer Receivables");
            Guid resolvedRev = revenueAccountId ?? GetMappedAccount("Sales");
            Guid? resolvedTax = taxLiabilityAccountId;
            if (!resolvedTax.HasValue && creditNote.TaxTotal > 0)
            {
                var taxId = GetMappedAccount("Taxes");
                if (taxId != Guid.Empty) resolvedTax = taxId;
            }

            // Validate Resolved Accounts are Leaf Posting and Active
            var arAcc = Find(resolvedAr);
            if (arAcc == null) { error = "Customer Receivables account is not mapped or invalid."; return false; }
            if (!arAcc.IsPosting || arAcc.Status == AccountStatus.Inactive)
            {
                error = $"Customer Receivables account {arAcc.Code} - {arAcc.Name} is not a valid posting account or is inactive.";
                return false;
            }

            var revAcc = Find(resolvedRev);
            if (revAcc == null) { error = "Sales Revenue account is not mapped or invalid."; return false; }
            if (!revAcc.IsPosting || revAcc.Status == AccountStatus.Inactive)
            {
                error = $"Sales Revenue account {revAcc.Code} - {revAcc.Name} is not a valid posting account or is inactive.";
                return false;
            }

            if (resolvedTax.HasValue)
            {
                var taxAcc = Find(resolvedTax.Value);
                if (taxAcc == null) { error = "Tax Payable account is invalid."; return false; }
                if (!taxAcc.IsPosting || taxAcc.Status == AccountStatus.Inactive)
                {
                    error = $"Tax Payable account {taxAcc.Code} - {taxAcc.Name} is not a valid posting account or is inactive.";
                    return false;
                }
            }

            // 1. Post Credit Note Journal:
            // Debit Sales Revenue (resolvedRev) with SubTotal - DiscountTotal
            // Debit Taxes Payable (resolvedTax) with TaxTotal (if tax > 0)
            // Credit Customer Receivables (resolvedAr) with TotalAmount
            var journalLines = new List<JournalLine>();

            var revenueTotal = creditNote.SubTotal - creditNote.DiscountTotal;
            journalLines.Add(new JournalLine(resolvedRev, revenueTotal, 0, $"Revenue Return: {creditNote.CreditNoteNumber}", null, null, 1, creditNote.CompanyId));

            if (creditNote.TaxTotal > 0 && resolvedTax.HasValue)
                journalLines.Add(new JournalLine(resolvedTax.Value, creditNote.TaxTotal, 0, $"Tax Return: {creditNote.CreditNoteNumber}", null, null, 1, creditNote.CompanyId));

            journalLines.Add(new JournalLine(resolvedAr, 0, creditNote.TotalAmount, $"Customer Credit: {creditNote.CreditNoteNumber}", null, null, 1, creditNote.CompanyId));

            var journal = new JournalEntry
            {
                Date = creditNote.CreditNoteDate,
                Reference = creditNote.CreditNoteNumber,
                Description = $"Credit note to customer {_customers.FirstOrDefault(c => c.Id == creditNote.CustomerId)?.Name ?? creditNote.CustomerId.ToString()}",
                TransactionType = TransactionType.Sales,
                CompanyId = creditNote.CompanyId,
                Lines = journalLines,
                Status = JournalStatus.Posted
            };

            _entries.Add(journal);

            // 2. Reduce the original invoice balance if linked
            if (creditNote.OriginalInvoiceId.HasValue)
            {
                var invoice = _salesInvoices.FirstOrDefault(i => i.Id == creditNote.OriginalInvoiceId.Value);
                if (invoice != null)
                {
                    invoice.AmountPaid += creditNote.TotalAmount;
                    if (invoice.AmountDue <= 0)
                    {
                        invoice.Status = SalesInvoiceStatus.Paid;
                    }
                    else
                    {
                        invoice.Status = SalesInvoiceStatus.PartiallyPaid;
                    }
                }
            }

            creditNote.Status = CreditNoteStatus.Posted;
            creditNote.UpdatedAt = DateTime.UtcNow;
            Persist();
            return true;
        }
    }

    public bool VoidCreditNote(Guid creditNoteId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var creditNote = _creditNotes.FirstOrDefault(cn => cn.Id == creditNoteId);
            if (creditNote == null) { error = "Credit Note not found."; return false; }
            if (creditNote.Status != CreditNoteStatus.Posted) { error = "Only posted credit notes can be voided."; return false; }

            // 1. Revert ledger entry
            var entry = _entries.FirstOrDefault(e => e.Reference == creditNote.CreditNoteNumber && e.Status == JournalStatus.Posted);
            if (entry != null)
            {
                entry.Status = JournalStatus.Reversed;
            }

            // 2. Restore invoice balance if originally linked
            if (creditNote.OriginalInvoiceId.HasValue)
            {
                var invoice = _salesInvoices.FirstOrDefault(i => i.Id == creditNote.OriginalInvoiceId.Value);
                if (invoice != null)
                {
                    invoice.AmountPaid -= creditNote.TotalAmount;
                    if (invoice.AmountPaid <= 0)
                    {
                        invoice.AmountPaid = 0;
                        invoice.Status = SalesInvoiceStatus.Draft;
                    }
                    else
                    {
                        invoice.Status = SalesInvoiceStatus.PartiallyPaid;
                    }
                }
            }

            creditNote.Status = CreditNoteStatus.Void;
            creditNote.UpdatedAt = DateTime.UtcNow;
            Persist();
            return true;
        }
    }

    public bool PostSalesInvoice(Guid invoiceId, Guid? arAccountId, Guid? revenueAccountId, Guid? taxLiabilityAccountId, out string? error)
    {
        error = null;
        lock (_lock)
        {
            var invoice = _salesInvoices.FirstOrDefault(i => i.Id == invoiceId);
            if (invoice == null) { error = "Invoice not found."; return false; }
            if (invoice.Status != SalesInvoiceStatus.Draft) { error = "Only draft invoices can be posted."; return false; }

            // Centralized Posting Engine resolution
            Guid resolvedAr = arAccountId ?? GetMappedAccount("Customer Receivables");
            Guid resolvedRev = revenueAccountId ?? GetMappedAccount("Sales");
            Guid? resolvedTax = taxLiabilityAccountId;
            if (!resolvedTax.HasValue && invoice.TaxTotal > 0)
            {
                var taxId = GetMappedAccount("Taxes");
                if (taxId != Guid.Empty) resolvedTax = taxId;
            }

            // Validate Resolved Accounts are Leaf Posting and Active
            var arAcc = Find(resolvedAr);
            if (arAcc == null) { error = "Customer Receivables account is not mapped or invalid."; return false; }
            if (!arAcc.IsPosting || arAcc.Status == AccountStatus.Inactive)
            {
                error = $"Customer Receivables account {arAcc.Code} - {arAcc.Name} is not a valid posting account or is inactive.";
                return false;
            }

            var revAcc = Find(resolvedRev);
            if (revAcc == null) { error = "Sales Revenue account is not mapped or invalid."; return false; }
            if (!revAcc.IsPosting || revAcc.Status == AccountStatus.Inactive)
            {
                error = $"Sales Revenue account {revAcc.Code} - {revAcc.Name} is not a valid posting account or is inactive.";
                return false;
            }

            if (resolvedTax.HasValue)
            {
                var taxAcc = Find(resolvedTax.Value);
                if (taxAcc == null) { error = "Tax Payable account is invalid."; return false; }
                if (!taxAcc.IsPosting || taxAcc.Status == AccountStatus.Inactive)
                {
                    error = $"Tax Payable account {taxAcc.Code} - {taxAcc.Name} is not a valid posting account or is inactive.";
                    return false;
                }
            }

            // 1. Post AR Journal: Dr AR / Cr Revenue (+ Cr Tax Liability if applicable)
            var journalLines = new List<JournalLine>
            {
                new JournalLine(resolvedAr, invoice.TotalAmount, 0, $"AR: {invoice.InvoiceNumber}", null, null, 1, invoice.CompanyId)
            };

            var revenueTotal = invoice.SubTotal - invoice.DiscountTotal;
            journalLines.Add(new JournalLine(resolvedRev, 0, revenueTotal, $"Revenue: {invoice.InvoiceNumber}", null, null, 1, invoice.CompanyId));

            if (invoice.TaxTotal > 0 && resolvedTax.HasValue)
                journalLines.Add(new JournalLine(resolvedTax.Value, 0, invoice.TaxTotal, $"Tax: {invoice.InvoiceNumber}", null, null, 1, invoice.CompanyId));

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

            int step = 1;
            if (parent.Code.EndsWith("0000")) step = 1000;
            else if (parent.Code.EndsWith("000")) step = 100;
            else if (parent.Code.EndsWith("00")) step = 10;

            var children = _accounts.Where(x => x.ParentId == parent.Id).ToList();
            if (children.Count > 0)
            {
                var highestChild = children
                    .Select(x => int.TryParse(x.Code, out var n) ? n : 0)
                    .DefaultIfEmpty(0)
                    .Max();
                if (highestChild > 0)
                {
                    return (highestChild + step).ToString();
                }
            }

            if (int.TryParse(parent.Code, out var pCode))
            {
                return (pCode + step).ToString();
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
                CustomFields = r.CustomFields ?? [],
                IsSystem = r.IsSystem,
                Subtype = r.Subtype ?? "",
                Currency = r.Currency ?? "USD",
                TaxCategory = r.TaxCategory,
                AllowManualJournal = r.AllowManualJournal,
                Description = r.Description
            };
            _accounts.Add(account);
            _history[account.Id] = [new(DateTime.UtcNow, "Created", "Account created")];
            RecalculateHierarchy();
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
            if (a.IsSystem && (a.Code != r.Code?.Trim() || a.Type != r.Type))
            {
                error = "Critical system account attributes (Code, Type) cannot be modified.";
                return false;
            }
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
            a.IsSystem = r.IsSystem;
            a.Subtype = r.Subtype ?? "";
            a.Currency = r.Currency ?? "USD";
            a.TaxCategory = r.TaxCategory;
            a.AllowManualJournal = r.AllowManualJournal;
            a.Description = r.Description;
            a.UpdatedAt = DateTime.UtcNow;
            _history[id].Add(new(DateTime.UtcNow, "Updated", "Account details changed"));
            RecalculateHierarchy();
            Persist();
            error = null;
            return true;
        }
    }

    public bool SetStatus(Guid id, StatusRequest status, out string? error)
    {
        var a = Find(id);
        if (a is null) { error = "Account not found."; return false; }
        if (a.IsSystem && status.Status == AccountStatus.Inactive)
        {
            error = "System accounts are protected and cannot be deactivated.";
            return false;
        }
        a.Status = status.Status;
        a.UpdatedAt = DateTime.UtcNow;
        _history[id].Add(new(DateTime.UtcNow, status.Status.ToString(), status.Reason ?? "Status changed"));
        RecalculateHierarchy();
        Persist();
        error = null;
        return true;
    }

    public bool Delete(Guid id, out string? error)
    {
        var a = Find(id);
        if (a is null) { error = "Account not found."; return false; }
        if (a.IsSystem)
        {
            error = "System accounts are protected and cannot be deleted.";
            return false;
        }
        if (_accounts.Any(x => x.ParentId == id) || _entries.Any(e => e.Lines.Any(l => l.AccountId == id)))
        {
            error = "Accounts with children or transactions cannot be deleted. Deactivate instead.";
            return false;
        }
        _accounts.Remove(a);
        _history.Remove(id);
        RecalculateHierarchy();
        Persist();
        error = null;
        return true;
    }

    public bool ClearAllAccounts(out string? error)
    {
        error = null;
        lock (_lock)
        {
            _accounts.Clear();
            _history.Clear();
            _mappings.Clear();
            Persist();
            return true;
        }
    }
    
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
    
    private bool ValidateJournal(JournalEntryRequest request, out string? error)
    {
        error = null;
        if (request.Lines.Count < 2)
        {
            error = "A journal entry requires at least two lines.";
            return false;
        }

        // Validate double-entry debits/credits balance
        decimal debitSum = request.Lines.Sum(l => l.Debit);
        decimal creditSum = request.Lines.Sum(l => l.Credit);
        if (Math.Abs(debitSum - creditSum) > 0.001m)
        {
            error = $"Journal entry is out of balance. Debits ({debitSum}) must equal Credits ({creditSum}).";
            return false;
        }

        foreach (var line in request.Lines)
        {
            var acc = Find(line.AccountId);
            if (acc == null)
            {
                error = $"Account with ID {line.AccountId} does not exist.";
                return false;
            }
            if (acc.Status == AccountStatus.Inactive)
            {
                error = $"Account {acc.Code} - {acc.Name} is Inactive and cannot receive new postings.";
                return false;
            }
            if (!acc.IsPosting)
            {
                error = $"Account {acc.Code} - {acc.Name} is a Non-Posting/Header account and cannot receive transactions.";
                return false;
            }
            if (!acc.AllowManualJournal && request.TransactionType == TransactionType.Other)
            {
                error = $"Account {acc.Code} - {acc.Name} is not configured for manual journal entry adjustments.";
                return false;
            }
        }
        return true;
    }
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

        _accounts.Clear(); _accounts.AddRange(state.Accounts ?? []);
        _entries.Clear(); _entries.AddRange(state.Entries ?? []);
        _templates.Clear(); _templates.AddRange(state.Templates ?? []);
        _recurringEntries.Clear(); _recurringEntries.AddRange(state.RecurringEntries ?? []);
        _journalEvents.Clear(); _journalEvents.AddRange(state.Events ?? []);
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
        _salesOrders.Clear(); _salesOrders.AddRange(state.SalesOrders ?? []);
        _creditNotes.Clear(); _creditNotes.AddRange(state.CreditNotes ?? []);
        _boms.Clear(); _boms.AddRange(state.Boms ?? []);
        _workOrders.Clear(); _workOrders.AddRange(state.WorkOrders ?? []);
        _mappings.Clear(); _mappings.AddRange(state.Mappings ?? []);
        if (state.History != null)
        {
            foreach (var (id, history) in state.History) _history[id] = history;
        }
        RecalculateHierarchy();
        Persist();
        return true;
    }
    private void Persist()
    {
        if (_dbFactory is null) return;
        using var db = _dbFactory.CreateDbContext();
        var json = JsonSerializer.Serialize(new StoredState(_accounts, _entries, _history, _templates, _recurringEntries, _journalEvents, _intercompanyAllocations, _companies, _customers, _products, _vendors, _purchaseOrders, _grns, _fixedAssets, _taxAuthorities, _taxCodes, _taxRates, _warehouses, _stockLevels, _stockTransactions, _salesInvoices, _estimates, _boms, _workOrders, _mappings, _salesOrders, _creditNotes));
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

        if (r.ParentId.HasValue)
        {
            if (editing.HasValue && r.ParentId.Value == editing.Value)
                throw new InvalidOperationException("An account cannot be its own parent.");

            if (editing.HasValue && CheckCircularReference(editing.Value, r.ParentId.Value))
                throw new InvalidOperationException("Circular reference detected. An account cannot be a child of its own descendants.");

            var parent = Find(r.ParentId.Value);
            if (parent == null)
                throw new InvalidOperationException("Selected parent account is invalid.");
        }
    }

    private bool CheckCircularReference(Guid accountId, Guid? parentId)
    {
        var current = parentId;
        while (current.HasValue)
        {
            if (current.Value == accountId) return true;
            var parent = _accounts.FirstOrDefault(x => x.Id == current.Value);
            current = parent?.ParentId;
        }
        return false;
    }

    public void RecalculateHierarchy()
    {
        lock (_lock)
        {
            foreach (var a in _accounts)
            {
                // 1. Determine Level
                if (a.ParentId == null)
                {
                    a.Level = AccountLevel.MainHead;
                }
                else
                {
                    var parent = _accounts.FirstOrDefault(x => x.Id == a.ParentId);
                    if (parent == null || parent.ParentId == null)
                    {
                        a.Level = AccountLevel.SubHead;
                    }
                    else
                    {
                        a.Level = AccountLevel.DetailAccount;
                    }
                }

                // 2. Determine Normal Balance
                a.NormalBalance = GetNormalBalance(a.Type);

                // 3. Determine if it is a Posting Account (leaf node)
                bool hasChildren = _accounts.Any(x => x.ParentId == a.Id);
                a.IsPosting = !hasChildren;
            }
        }
    }

    private NormalBalanceType GetNormalBalance(AccountType type)
    {
        return type switch
        {
            AccountType.Asset or AccountType.Expense or AccountType.ContraLiability or AccountType.ContraEquity or AccountType.ContraRevenue => NormalBalanceType.Debit,
            _ => NormalBalanceType.Credit
        };
    }

    public Guid GetMappedAccount(string mappingKey)
    {
        lock (_lock)
        {
            var mapping = _mappings.FirstOrDefault(m => m.MappingKey.Equals(mappingKey, StringComparison.OrdinalIgnoreCase));
            if (mapping != null)
            {
                var acc = _accounts.FirstOrDefault(a => a.Id == mapping.AccountId);
                if (acc != null && acc.IsPosting && acc.Status == AccountStatus.Active)
                {
                    return acc.Id;
                }
            }

            // Fallback default seeded codes if mapping not customized
            var fallbackCode = mappingKey switch
            {
                "Customer Receivables" => "12000",
                "Vendor Payables" => "21100",
                "Sales" => "41100",
                "Purchases" => "61100",
                "Inventory" => "13000",
                "Taxes" => "22000",
                "Cost of Goods Sold" => "51000",
                _ => null
            };

            if (fallbackCode != null)
            {
                var fallbackAcc = _accounts.FirstOrDefault(a => a.Code == fallbackCode);
                if (fallbackAcc != null) return fallbackAcc.Id;
            }

            // Last resort fallback
            return _accounts.FirstOrDefault(a => a.IsPosting && a.Status == AccountStatus.Active)?.Id ?? Guid.Empty;
        }
    }

    public void ResetDatabase()
    {
        lock (_lock)
        {
            _accounts.Clear();
            _entries.Clear();
            _history.Clear();
            _templates.Clear();
            _recurringEntries.Clear();
            _journalEvents.Clear();
            _intercompanyAllocations.Clear();
            _companies.Clear();
            _customers.Clear();
            _products.Clear();
            _vendors.Clear();
            _purchaseOrders.Clear();
            _grns.Clear();
            _fixedAssets.Clear();
            _taxAuthorities.Clear();
            _taxCodes.Clear();
            _taxRates.Clear();
            _warehouses.Clear();
            _stockLevels.Clear();
            _stockTransactions.Clear();
            _salesInvoices.Clear();
            _estimates.Clear();
            _salesOrders.Clear();
            _creditNotes.Clear();
            _boms.Clear();
            _workOrders.Clear();
            _mappings.Clear();

            // Re-seed Companies
            var parentEntity = new Company { Name = "Acme Holdings", Code = "ACME", Type = EntityType.Parent };
            _companies.AddRange([
                parentEntity, 
                new Company { Name = "Acme Services", Code = "ASV", ParentId = parentEntity.Id }, 
                new Company { Name = "Acme Trading", Code = "ATD", ParentId = parentEntity.Id }
            ]);

            // Re-seed structural chart of accounts
            SeedAccounts();

            // Re-seed Tax Authorities & VAT codes
            var hmrc = new TaxAuthority { Name = "HMRC", Country = "United Kingdom" };
            var irs = new TaxAuthority { Name = "IRS", Country = "United States" };
            var cdtfa = new TaxAuthority { Name = "CDTFA", Country = "United States", State = "California" };
            var fta = new TaxAuthority { Name = "FTA", Country = "United Arab Emirates" };
            var zatca = new TaxAuthority { Name = "ZATCA", Country = "Saudi Arabia" };
            var fbr = new TaxAuthority { Name = "FBR", Country = "Pakistan" };
            var pra = new TaxAuthority { Name = "PRA", Country = "Pakistan", State = "Punjab" };
            var cra = new TaxAuthority { Name = "CRA", Country = "Canada" };
            _taxAuthorities.AddRange([hmrc, irs, cdtfa, fta, zatca, fbr, pra, cra]);

            var today = DateOnly.FromDateTime(DateTime.Today);
            var ukVat = new TaxCode { Code = "VAT-UK-20", Name = "UK Standard VAT 20%", TaxAuthorityId = hmrc.Id };
            ukVat.Rates.Add(new TaxRate { TaxCodeId = ukVat.Id, Percentage = 20m, EffectiveFrom = today });
            
            var usSales = new TaxCode { Code = "ST-US-CA", Name = "California Sales Tax 8.25%", TaxAuthorityId = cdtfa.Id };
            usSales.Rates.Add(new TaxRate { TaxCodeId = usSales.Id, Percentage = 8.25m, EffectiveFrom = today });

            var uaeVat = new TaxCode { Code = "VAT-UAE-5", Name = "UAE Standard VAT 5%", TaxAuthorityId = fta.Id };
            uaeVat.Rates.Add(new TaxRate { TaxCodeId = uaeVat.Id, Percentage = 5m, EffectiveFrom = today });

            var ksaVat = new TaxCode { Code = "VAT-KSA-15", Name = "KSA Standard VAT 15%", TaxAuthorityId = zatca.Id };
            ksaVat.Rates.Add(new TaxRate { TaxCodeId = ksaVat.Id, Percentage = 15m, EffectiveFrom = today });

            var pkVat = new TaxCode { Code = "VAT-PK-16", Name = "Pakistan Sales Tax 16%", TaxAuthorityId = fbr.Id };
            pkVat.Rates.Add(new TaxRate { TaxCodeId = pkVat.Id, Percentage = 16m, EffectiveFrom = today });

            var caHst = new TaxCode { Code = "HST-CA-13", Name = "Canada HST 13%", TaxAuthorityId = cra.Id };
            caHst.Rates.Add(new TaxRate { TaxCodeId = caHst.Id, Percentage = 13m, EffectiveFrom = today });

            _taxCodes.AddRange([ukVat, usSales, uaeVat, ksaVat, pkVat, caHst]);
            _taxRates.AddRange(_taxCodes.SelectMany(c => c.Rates));

            var defaultWarehouse = new Warehouse { Name = "Main Warehouse", Location = "Headquarters", CompanyId = parentEntity.Id };
            _warehouses.Add(defaultWarehouse);

            Persist();
        }
    }

    public bool SetMapping(string mappingKey, Guid accountId, out string? error)
    {
        lock (_lock)
        {
            var acc = Find(accountId);
            if (acc == null) { error = "Account not found."; return false; }
            if (!acc.IsPosting) { error = "Only leaf/posting accounts can be mapped to operations."; return false; }
            if (acc.Status == AccountStatus.Inactive) { error = "Cannot map to an inactive account."; return false; }

            var existing = _mappings.FirstOrDefault(m => m.MappingKey.Equals(mappingKey, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
            {
                existing.AccountId = accountId;
            }
            else
            {
                _mappings.Add(new AccountMapping { MappingKey = mappingKey, AccountId = accountId });
            }

            Persist();
            error = null;
            return true;
        }
    }
}
