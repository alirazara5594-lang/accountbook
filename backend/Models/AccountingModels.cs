namespace Zenabook.Api.Models;

public enum AccountType { Asset, Liability, Equity, Revenue, Expense, ContraAsset, ContraLiability, ContraEquity, ContraRevenue, ContraExpense }
public enum AccountStatus { Active, Inactive }
public enum AccountLevel { MainHead, SubHead, DetailAccount }
public enum NormalBalanceType { Debit, Credit }

public class Account
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; set; }
    public required string Name { get; set; }
    public AccountType Type { get; set; }
    public Guid? ParentId { get; set; }
    public AccountStatus Status { get; set; } = AccountStatus.Active;
    public decimal OpeningBalance { get; set; }
    public DateOnly? OpeningBalanceDate { get; set; }
    public bool ReconciliationEnabled { get; set; }
    public string? IfrsTag { get; set; }
    public string? GaapTag { get; set; }
    public Dictionary<string, string> CustomFields { get; set; } = [];
    public bool IsSystem { get; set; } = false;
    
    // GAAP-compliant structural and rules properties
    public string Subtype { get; set; } = "";
    public AccountLevel Level { get; set; } = AccountLevel.DetailAccount;
    public bool IsPosting { get; set; } = true;
    public NormalBalanceType NormalBalance { get; set; } = NormalBalanceType.Debit;
    public string Currency { get; set; } = "USD";
    public string? TaxCategory { get; set; }
    public bool AllowManualJournal { get; set; } = true;
    public string? Description { get; set; }
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record AccountRequest(
    string? Code, 
    string Name, 
    AccountType Type, 
    Guid? ParentId, 
    decimal OpeningBalance, 
    DateOnly? OpeningBalanceDate, 
    bool ReconciliationEnabled, 
    string? IfrsTag, 
    string? GaapTag, 
    Dictionary<string,string>? CustomFields, 
    bool IsSystem = false,
    string? Subtype = null,
    string? Currency = "USD",
    string? TaxCategory = null,
    bool AllowManualJournal = true,
    string? Description = null
);

public class AccountMapping
{
    public required string MappingKey { get; set; }
    public Guid AccountId { get; set; }
}

public record AccountMappingRequest(string MappingKey, Guid AccountId);
public record StatusRequest(AccountStatus Status, string? Reason);
public enum JournalStatus { Draft, Submitted, Approved, Posted, Reversed, Rejected }
public enum TransactionType { Sales, Purchase, Payment, Receipt, Adjustment, Transfer, Payroll, Depreciation, Accrual, Prepayment, Tax, Loan, Inventory, WriteOff, InterCompany, Other }
public enum RecurrenceFrequency { Daily, Weekly, Monthly, Quarterly, Yearly }
public record JournalLineRequest(Guid AccountId, decimal Debit, decimal Credit, string? Memo, string? Comment = null, string? CurrencyCode = null, decimal? ExchangeRate = null, Guid? CompanyId = null);
public record JournalEntryRequest(DateOnly Date, string Reference, string Description, List<JournalLineRequest> Lines, TransactionType TransactionType = TransactionType.Other, string CurrencyCode = "USD", decimal ExchangeRate = 1m, Guid? CompanyId = null, Guid? CounterpartyCompanyId = null, DateOnly? ReversalDate = null, bool AutoReverse = false, string? TemplateId = null, long? Version = null);
public class JournalEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateOnly Date { get; init; }
    public required string Reference { get; init; }
    public required string Description { get; init; }
    public required List<JournalLine> Lines { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public JournalStatus Status { get; set; } = JournalStatus.Draft;
    public TransactionType TransactionType { get; init; }
    public string CurrencyCode { get; init; } = "USD";
    public decimal ExchangeRate { get; init; } = 1m;
    public Guid? CompanyId { get; init; }
    public Guid? CounterpartyCompanyId { get; init; }
    public DateOnly? ReversalDate { get; init; }
    public bool AutoReverse { get; init; }
    public Guid? ReversalOfId { get; init; }
    public long Version { get; set; } = 1;
    public string? SubmittedBy { get; set; }
    public string? ApprovedBy { get; set; }
    public List<Attachment> Attachments { get; set; } = [];
}
public record JournalLine(Guid AccountId, decimal Debit, decimal Credit, string? Memo, string? Comment = null, string? CurrencyCode = null, decimal? ExchangeRate = null, Guid? CompanyId = null);
public record AuditItem(DateTime At, string Action, string Detail);
public record Attachment(string FileName, string ContentType, string Url, DateTime AddedAt);
public record AttachmentRequest(string FileName, string ContentType, string Url);
public record TransitionRequest(long Version, string? Note = null);
public record BatchPostRequest(List<Guid> EntryIds);
public record RecurringEntryRequest(JournalEntryRequest Entry, RecurrenceFrequency Frequency, DateOnly StartsOn, DateOnly? EndsOn = null);
public class RecurringJournalEntry { public Guid Id { get; init; } = Guid.NewGuid(); public required JournalEntryRequest Entry { get; init; } public RecurrenceFrequency Frequency { get; init; } public DateOnly StartsOn { get; init; } public DateOnly? EndsOn { get; init; } public bool Active { get; set; } = true; }
public record JournalTemplateRequest(string Name, string Description, TransactionType TransactionType, string CurrencyCode, List<JournalLineRequest> Lines);
public class JournalTemplate { public Guid Id { get; init; } = Guid.NewGuid(); public required string Name { get; init; } public required string Description { get; init; } public TransactionType TransactionType { get; init; } public string CurrencyCode { get; init; } = "USD"; public required List<JournalLineRequest> Lines { get; init; } }
public record JournalEvent(Guid Id, Guid JournalEntryId, string EventType, DateTime OccurredAt, string Actor, string Detail, long Version);

public class Company
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? Code { get; set; }
    public string? LegalName { get; set; }
    public EntityType Type { get; set; } = EntityType.Subsidiary;
    public Guid? ParentId { get; set; }
    public string Country { get; set; } = "United States";
    public string CurrencyCode { get; set; } = "USD";
    public Guid? TaxAuthorityId { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
public enum EntityType { Parent, Subsidiary, Branch, JointVenture, Associate }
public record CompanyRequest(string Name, string? Code, string? LegalName, EntityType Type, Guid? ParentId, string Country, string CurrencyCode, Guid? TaxAuthorityId);
public record CompanyStatusRequest(bool Active);

public enum IntercompanyChargeFrequency { OneTime, Hourly, Weekly, Monthly, Quarterly, Yearly }
public enum IntercompanyAllocationStatus { Draft, Active, Paused, Closed }
public record IntercompanyStatusRequest(IntercompanyAllocationStatus Status);
public record IntercompanyRecipientRequest(Guid CompanyId, decimal SharePercent);
public record IntercompanyAllocationRequest(
    string Name,
    Guid SourceCompanyId,
    string Category,
    string? Description,
    IntercompanyChargeFrequency Frequency,
    decimal Rate,
    decimal Quantity,
    DateOnly StartDate,
    DateOnly? EndDate,
    List<IntercompanyRecipientRequest> Recipients);
public class IntercompanyAllocation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; }
    public Guid SourceCompanyId { get; set; }
    public required string Category { get; set; }
    public string? Description { get; set; }
    public IntercompanyChargeFrequency Frequency { get; set; }
    public decimal Rate { get; set; }
    public decimal Quantity { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public IntercompanyAllocationStatus Status { get; set; } = IntercompanyAllocationStatus.Active;
    public List<IntercompanyRecipientRequest> Recipients { get; set; } = [];
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum CustomerStatus { Active, Inactive, Blocked }

public class Customer
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string CustomerNumber { get; set; }
    public required string Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? TaxId { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; } = "United States";
    public string CurrencyCode { get; set; } = "USD";
    public decimal CreditLimit { get; set; } = 0m;
    public int PaymentTermsDays { get; set; } = 30;
    public Guid? CompanyId { get; set; }
    public CustomerStatus Status { get; set; } = CustomerStatus.Active;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record CustomerRequest(
    string? CustomerNumber,
    string Name,
    string? Email,
    string? Phone,
    string? TaxId,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    string? CurrencyCode,
    decimal CreditLimit,
    int PaymentTermsDays,
    Guid? CompanyId);

public record CustomerStatusRequest(CustomerStatus Status, string? Reason);

public enum ProductType { Physical, Service, NonInventory, Bundle }
public enum ProductStatus { Active, Inactive, Discontinued }

public class Product
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public ProductType Type { get; set; } = ProductType.Physical;
    public string? Category { get; set; }
    public string Unit { get; set; } = "Each";
    public decimal QuantityOnHand { get; set; } = 0m;
    public decimal UnitPrice { get; set; } = 0m;
    public decimal CostPrice { get; set; } = 0m;
    public Guid? TaxCodeId { get; set; }

    public Guid? IncomeAccountId { get; set; }
    public Guid? ExpenseAccountId { get; set; }
    public Guid? AssetAccountId { get; set; }

    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record ProductRequest(
    string? Code,
    string Name,
    string? Description,
    ProductType Type,
    string? Category,
    string Unit,
    decimal UnitPrice,
    decimal CostPrice,
    Guid? TaxCodeId,
    Guid? IncomeAccountId,
    Guid? ExpenseAccountId,
    Guid? AssetAccountId);

public record ProductStatusRequest(ProductStatus Status, string? Reason);

public enum VendorStatus { Active, Inactive, Blocked }

public class Vendor
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string VendorNumber { get; set; }
    public required string Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? TaxId { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; } = "United States";
    public string CurrencyCode { get; set; } = "USD";
    public int PaymentTermsDays { get; set; } = 30;
    public Guid? DefaultExpenseAccountId { get; set; }
    public Guid? CompanyId { get; set; }
    public VendorStatus Status { get; set; } = VendorStatus.Active;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record VendorRequest(
    string? VendorNumber,
    string Name,
    string? Email,
    string? Phone,
    string? TaxId,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    string? CurrencyCode,
    int PaymentTermsDays,
    Guid? DefaultExpenseAccountId,
    Guid? CompanyId);

public record VendorStatusRequest(VendorStatus Status, string? Reason);

public enum LineDestination { Inventory, ManufacturingMaterial, FixedAsset, Expense }
public enum PurchaseRequestStatus { Draft, Submitted, Approved, Rejected, Ordered }
public record PurchaseRequestLineRequest(Guid ProductId, string Description, decimal Quantity);
public record PurchaseRequestRequest(string RequestNumber, string RequesterName, DateOnly Date, List<PurchaseRequestLineRequest> Lines);

public class PurchaseRequestLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? ProductId { get; set; }
    public required string Description { get; set; }
    public decimal Quantity { get; set; } = 1;
    public decimal EstimatedUnitPrice { get; set; } = 0;
    public decimal EstimatedTotal => Quantity * EstimatedUnitPrice;
    public LineDestination Destination { get; set; } = LineDestination.Inventory;
    public Guid? TargetWarehouseId { get; set; }
    public Guid? ExpenseAccountId { get; set; }
}

public class PurchaseRequest
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string RequestNumber { get; set; }
    public required string RequesterName { get; set; }
    public string Department { get; set; } = "General";
    public string Priority { get; set; } = "Medium";
    public DateOnly Date { get; set; }
    public DateOnly? RequiredByDate { get; set; }
    public PurchaseRequestStatus Status { get; set; } = PurchaseRequestStatus.Draft;
    public decimal TotalEstimatedAmount => Lines.Sum(l => l.EstimatedTotal);
    public List<PurchaseRequestLine> Lines { get; set; } = [];
    public Guid CompanyId { get; set; }
}

public enum RfqStatus { Open, Closed, Awarded, Canceled }

public class RequestForQuotationLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? ProductId { get; set; }
    public required string Description { get; set; }
    public decimal Quantity { get; set; } = 1;
    public LineDestination Destination { get; set; } = LineDestination.Inventory;
}

public class RequestForQuotation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string RfqNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid? PurchaseRequestId { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly Deadline { get; set; }
    public RfqStatus Status { get; set; } = RfqStatus.Open;
    public List<RequestForQuotationLine> Lines { get; set; } = [];
    public Guid CompanyId { get; set; }
}

public class VendorQuoteLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
    public decimal QuotedTotal => Quantity * UnitPrice;
    public Guid? TaxCodeId { get; set; }
    public decimal TaxAmount { get; set; } = 0;
    public LineDestination Destination { get; set; } = LineDestination.Inventory;
}

public class VendorQuote
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string QuoteNumber { get; set; } = string.Empty;
    public Guid RequestForQuotationId { get; set; }
    public Guid VendorId { get; set; }
    public DateOnly Date { get; set; }
    public int DeliveryLeadTimeDays { get; set; } = 7;
    public decimal TotalAmount => Lines.Sum(l => l.QuotedTotal);
    public bool IsWinningQuote { get; set; } = false;
    public List<VendorQuoteLine> Lines { get; set; } = [];
    public Guid CompanyId { get; set; }
}

public record RfqRequest(string RfqNumber, Guid? PurchaseRequestId, DateOnly Date, DateOnly Deadline, List<RequestForQuotationLine> Lines);
public record VendorQuoteRequest(Guid RequestForQuotationId, Guid VendorId, DateOnly Date, List<VendorQuoteLine> Lines);

public enum VendorBillStatus { Draft, Open, PartiallyPaid, Paid, Void }

public class VendorBillLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public string Description { get; set; } = "";
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public Guid? TaxCodeId { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount => (Quantity * UnitPrice) + TaxAmount;
    public LineDestination Destination { get; set; } = LineDestination.Expense;
}

public class VendorBill
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string BillNumber { get; set; }
    public required string VendorInvoiceNumber { get; set; }
    public Guid VendorId { get; set; }
    public Guid? PurchaseOrderId { get; set; }
    public Guid? GoodsReceiptNoteId { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly DueDate { get; set; }
    public VendorBillStatus Status { get; set; } = VendorBillStatus.Draft;
    public List<VendorBillLine> Lines { get; set; } = [];
    public Guid CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public bool HasVarianceWarning { get; set; } = false;
    public int PaymentTermsDays { get; set; } = 30;
    public string CurrencyCode { get; set; } = "USD";
    public string? Notes { get; set; }
    public decimal AmountPaid { get; set; } = 0;
    public decimal AmountDue => Lines.Sum(l => l.TotalAmount) - AmountPaid;
    public decimal TotalAmount => Lines.Sum(l => l.TotalAmount);
}

public enum VendorPaymentStatus { Draft, Posted, Void }

public class VendorPayment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string PaymentNumber { get; set; }
    public Guid VendorId { get; set; }
    public Guid? BillId { get; set; }                       // optional: payment against a specific bill
    public DateOnly PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethodType PaymentMethod { get; set; } = PaymentMethodType.BankTransfer;
    public string? BankAccountName { get; set; }            // bank account name when method = Bank
    public Guid? WithdrawFromAccountId { get; set; }        // Chart-of-Account: Cash or Bank account money comes FROM
    public string? Reference { get; set; }                  // cheque #, wire ref, etc.
    public string? Memo { get; set; }
    public VendorPaymentStatus Status { get; set; } = VendorPaymentStatus.Draft;
    public Guid? JournalEntryId { get; set; }               // linked double-entry journal
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record VendorPaymentRequest(
    Guid VendorId,
    Guid? BillId,
    DateOnly PaymentDate,
    decimal Amount,
    PaymentMethodType PaymentMethod = PaymentMethodType.BankTransfer,
    string? BankAccountName = null,
    Guid? WithdrawFromAccountId = null,
    string? Reference = null,
    string? Memo = null,
    Guid? CompanyId = null
);

public enum FundTransferStatus { Draft, Posted, Void }

public class FundTransfer
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string TransferNumber { get; set; }
    public Guid FromAccountId { get; set; }
    public Guid ToAccountId { get; set; }
    public decimal Amount { get; set; }
    public DateOnly TransferDate { get; set; }
    public string? Reference { get; set; }
    public string? Memo { get; set; }
    public FundTransferStatus Status { get; set; } = FundTransferStatus.Draft;
    public Guid? JournalEntryId { get; set; }               // linked double-entry journal
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public record FundTransferRequest(
    Guid FromAccountId,
    Guid ToAccountId,
    decimal Amount,
    DateOnly TransferDate,
    string? Reference = null,
    string? Memo = null,
    Guid? CompanyId = null
);

public enum ReconciliationStatus { InProgress, Balanced, Difference }

public class BankReconciliation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BankAccountId { get; set; }
    public DateOnly StatementDate { get; set; }
    public decimal StatementBalance { get; set; }
    public decimal GlBalance { get; set; }
    public decimal Difference => StatementBalance - GlBalance;
    public ReconciliationStatus Status { get; set; } = ReconciliationStatus.InProgress;
    public string? Memo { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public record BankReconciliationRequest(
    Guid BankAccountId,
    DateOnly StatementDate,
    decimal StatementBalance,
    string? Memo = null,
    Guid? CompanyId = null
);

public record CashBankAccountRequest(
    string Name,
    string Code,
    string Currency = "USD",
    decimal OpeningBalance = 0,
    bool ReconciliationEnabled = true,
    string? BankName = null,
    Guid? CompanyId = null
);

public enum BudgetStatus { Draft, Active, Locked }
public enum BudgetPeriodType { Monthly, Quarterly, Yearly }

public class Budget
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string BudgetName { get; set; }
    public Guid AccountId { get; set; }
    public decimal Amount { get; set; }
    public int FiscalYear { get; set; }
    public BudgetPeriodType PeriodType { get; set; } = BudgetPeriodType.Monthly;
    public BudgetStatus Status { get; set; } = BudgetStatus.Draft;
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record BudgetRequest(
    string BudgetName,
    Guid AccountId,
    decimal Amount,
    int FiscalYear,
    BudgetPeriodType PeriodType = BudgetPeriodType.Monthly,
    BudgetStatus Status = BudgetStatus.Draft,
    Guid? CompanyId = null
);

public class PeriodClose
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string PeriodName { get; set; }          // e.g. "FY2026-Q3", "August 2026"
    public DateOnly? PeriodEndDate { get; set; }
    public PeriodCloseStatus Status { get; set; } = PeriodCloseStatus.Open;
    public string? Note { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public string? ClosedBy { get; set; }
}

public enum PeriodCloseStatus { Open, Closed, Reopened }

public record PeriodCloseRequest(
    string PeriodName,
    DateOnly? PeriodEndDate = null,
    string? Note = null,
    Guid? CompanyId = null
);

public record VendorBillLineRequest(Guid ProductId, string Description, decimal Quantity, decimal UnitPrice, Guid? TaxCodeId, decimal TaxAmount, LineDestination Destination);
public record VendorBillRequest(
    string BillNumber,
    string VendorInvoiceNumber,
    Guid VendorId,
    Guid? PurchaseOrderId,
    Guid? GoodsReceiptNoteId,
    DateOnly Date,
    DateOnly DueDate,
    List<VendorBillLineRequest> Lines,
    Guid CompanyId,
    bool HasVarianceWarning,
    int PaymentTermsDays = 30,
    string CurrencyCode = "USD",
    string? Notes = null
);

public enum PurchaseOrderStatus { Draft, Issued, PartiallyReceived, Fulfilled, Canceled }

public class PurchaseOrderLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public string Description { get; set; } = "";
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public Guid? TaxCodeId { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount => (Quantity * UnitPrice) + TaxAmount;
    public LineDestination Destination { get; set; } = LineDestination.Expense;
    public decimal ReceivedQuantity { get; set; } = 0m;
}

public class PurchaseOrder
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string PoNumber { get; set; }
    public Guid VendorId { get; set; }
    public Guid? VendorQuoteId { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly? ExpectedDeliveryDate { get; set; }
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public List<PurchaseOrderLine> Lines { get; set; } = [];
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record PurchaseOrderLineRequest(Guid ProductId, string Description, decimal Quantity, decimal UnitPrice, Guid? TaxCodeId, decimal TaxAmount, LineDestination Destination);
public record PurchaseOrderRequest(string? PoNumber, Guid VendorId, Guid? VendorQuoteId, DateOnly Date, DateOnly? ExpectedDeliveryDate, List<PurchaseOrderLineRequest> Lines, Guid? CompanyId);
public record PurchaseOrderStatusRequest(PurchaseOrderStatus Status);

public class GoodsReceiptNoteLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid PurchaseOrderLineId { get; set; }
    public decimal QuantityReceived { get; set; }
}

public class GoodsReceiptNote
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string GrnNumber { get; set; }
    public Guid PurchaseOrderId { get; set; }
    public DateOnly DateReceived { get; set; }
    public List<GoodsReceiptNoteLine> Lines { get; set; } = [];
    public string? Notes { get; set; }
    public bool IsProcessed { get; set; } = false; // True if it has updated inventory/assets and created accrual journals
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public record GoodsReceiptNoteLineRequest(Guid PurchaseOrderLineId, decimal QuantityReceived);
public record GoodsReceiptNoteRequest(string? GrnNumber, Guid PurchaseOrderId, DateOnly DateReceived, List<GoodsReceiptNoteLineRequest> Lines, string? Notes);
public record GoodsReceiptProcessRequest();

public enum AssetStatus { Active, Disposed, Depreciated }
public enum DepreciationMethod { StraightLine, DecliningBalance }

public class FixedAsset
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string AssetTag { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public DateOnly PurchaseDate { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SalvageValue { get; set; } = 0m;
    public int UsefulLifeYears { get; set; } = 3;
    public DepreciationMethod DepreciationMethod { get; set; } = DepreciationMethod.StraightLine;
    public decimal AccumulatedDepreciation { get; set; } = 0m;
    public decimal NetBookValue => PurchasePrice - AccumulatedDepreciation;
    public AssetStatus Status { get; set; } = AssetStatus.Active;
    public Guid? AssetAccountId { get; set; }
    public Guid? AccumulatedDepreciationAccountId { get; set; }
    public Guid? DepreciationExpenseAccountId { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Warehouse
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? Location { get; set; }
    public Guid? CompanyId { get; set; }
}

public class StockLevel
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public decimal QuantityOnHand { get; set; }
    public decimal MovingAverageCost { get; set; }
    public Guid? CompanyId { get; set; }
}

public enum StockTransactionType { In, Out, Adjustment, Transfer }

public class StockTransaction
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateOnly Date { get; set; }
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public StockTransactionType Type { get; set; }
    public string? Reference { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public class TaxAuthority
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; } // e.g. HMRC, IRS, ZATCA
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? RegistrationNumber { get; set; }
    public Guid? LiabilityAccountId { get; set; }
}

public class TaxCode
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; set; } // e.g. VAT-20, SR, Z
    public required string Name { get; set; } // e.g. Standard Rate 20%
    public string? Description { get; set; }
    public Guid TaxAuthorityId { get; set; }
    public List<TaxRate> Rates { get; set; } = []; // Allows rate history (e.g. rate changes from 15% to 20%)
    public bool IsActive { get; set; } = true;
}

public class TaxRate
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid TaxCodeId { get; set; }
    public decimal Percentage { get; set; } // e.g. 20.00
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
}

public record TaxAuthorityRequest(string Name, string? Country, string? State, string? RegistrationNumber, Guid? LiabilityAccountId);
public record TaxRateRequest(decimal Percentage, DateOnly EffectiveFrom, DateOnly? EffectiveTo);
public record TaxCodeRequest(string Code, string Name, string? Description, Guid TaxAuthorityId, List<TaxRateRequest> Rates, bool IsActive);

// ─── Sales Invoice ────────────────────────────────────────────────────────────
public enum SalesInvoiceStatus { Draft, Sent, Paid, Void, PartiallyPaid, Overdue }

public class SalesInvoiceLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public Guid? TaxCodeId { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal => Quantity * UnitPrice;
    public decimal LineTotalAfterDiscount => LineTotal - DiscountAmount;
    public decimal LineTotalWithTax => LineTotalAfterDiscount + TaxAmount;
}

public class SalesInvoice
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string InvoiceNumber { get; set; }
    public Guid CustomerId { get; set; }
    public DateOnly InvoiceDate { get; set; }
    public DateOnly DueDate { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public SalesInvoiceStatus Status { get; set; } = SalesInvoiceStatus.Draft;
    public List<SalesInvoiceLine> Lines { get; set; } = [];
    public decimal SubTotal => Lines.Sum(l => l.LineTotal);
    public decimal DiscountTotal => Lines.Sum(l => l.DiscountAmount);
    public decimal TaxTotal => Lines.Sum(l => l.TaxAmount);
    public decimal TotalAmount => Lines.Sum(l => l.LineTotalWithTax);
    public decimal AmountPaid { get; set; } = 0;
    public decimal AmountDue => TotalAmount - AmountPaid;
    public bool StockReduced { get; set; } = false; // prevents double stock-out
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record SalesInvoiceLineRequest(Guid? ProductId, string Description, decimal Quantity, decimal UnitPrice, decimal DiscountAmount, Guid? TaxCodeId, decimal TaxAmount);

public record SalesInvoiceRequest(string? InvoiceNumber, Guid CustomerId, DateOnly InvoiceDate, DateOnly DueDate, string? Reference, string? Notes, List<SalesInvoiceLineRequest> Lines, Guid? CompanyId);
public record SalesInvoiceStatusRequest(SalesInvoiceStatus Status);

// ─── Estimates & Quotes ───────────────────────────────────────────────────────
public enum EstimateStatus { Draft, Sent, Accepted, Rejected, Expired, Invoiced }
public enum DiscountType { Percentage, FixedAmount }

public class EstimateLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.Percentage;
    public decimal DiscountValue { get; set; } = 0; // % or fixed amount depending on DiscountType
    public Guid? TaxCodeId { get; set; }
    public decimal TaxPercent { get; set; } = 0;

    // Computed
    public decimal LineSubTotal => Quantity * UnitPrice;
    public decimal DiscountAmount => DiscountType == DiscountType.Percentage
        ? Math.Round(LineSubTotal * DiscountValue / 100, 2)
        : DiscountValue;
    public decimal LineAfterDiscount => LineSubTotal - DiscountAmount;
    public decimal TaxAmount => Math.Round(LineAfterDiscount * TaxPercent / 100, 2);
    public decimal LineTotal => LineAfterDiscount + TaxAmount;
}

public class Estimate
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string EstimateNumber { get; set; }
    public Guid CustomerId { get; set; }
    public DateOnly EstimateDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public string? Terms { get; set; }
    public EstimateStatus Status { get; set; } = EstimateStatus.Draft;
    public List<EstimateLine> Lines { get; set; } = [];

    // Computed totals
    public decimal SubTotal => Lines.Sum(l => l.LineSubTotal);
    public decimal TotalDiscount => Lines.Sum(l => l.DiscountAmount);
    public decimal TotalTax => Lines.Sum(l => l.TaxAmount);
    public decimal TotalAmount => Lines.Sum(l => l.LineTotal);

    public Guid? ConvertedToInvoiceId { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record EstimateLineRequest(
    Guid? ProductId, string Description, decimal Quantity, decimal UnitPrice,
    DiscountType DiscountType, decimal DiscountValue, Guid? TaxCodeId, decimal TaxPercent);

public record EstimateRequest(
    string? EstimateNumber, Guid CustomerId, DateOnly EstimateDate, DateOnly? ExpiryDate,
    string? Reference, string? Notes, string? Terms,
    List<EstimateLineRequest> Lines, Guid? CompanyId);

public record EstimateStatusRequest(EstimateStatus Status);

public class GoodsReceiptLine
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string GrnId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ProductId { get; set; }
    public decimal OrderedQuantity { get; set; } = 1;
    public decimal ReceivedQuantity { get; set; } = 1;
    public decimal RejectedQuantity { get; set; } = 0;
    public decimal UnitCost { get; set; } = 0;
    public LineDestination Destination { get; set; } = LineDestination.Inventory;
    public string TargetWarehouseId { get; set; } = string.Empty;
    public string? ExpenseAccountId { get; set; }
    public string? RejectionReason { get; set; }
}

public class GoodsReceiptNoteModel
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string GrnNumber { get; set; } = string.Empty;
    public string PurchaseOrderId { get; set; } = string.Empty;
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public string VendorId { get; set; } = string.Empty;
    public string VendorName { get; set; } = string.Empty;
    public string ReceivedDate { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");
    public string DeliveryChallanNumber { get; set; } = string.Empty;
    public string ReceivedBy { get; set; } = "Warehouse Inspector";
    public string TargetWarehouseId { get; set; } = string.Empty;
    public string? CompanyId { get; set; }

    public List<GoodsReceiptLine> Lines { get; set; } = new();
}

public class ThreeWayMatchCheck
{
    public string PurchaseOrderId { get; set; } = string.Empty;
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public string GrnId { get; set; } = string.Empty;
    public string GrnNumber { get; set; } = string.Empty;
    public string VendorBillNumber { get; set; } = string.Empty;

    public decimal OrderedAmount { get; set; } = 0;
    public decimal ReceivedAmount { get; set; } = 0;
    public decimal BilledAmount { get; set; } = 0;

    public decimal QuantityVariance { get; set; } = 0;
    public decimal PriceVariance { get; set; } = 0;
    public bool IsMatched { get; set; } = true;
    public string Status { get; set; } = "Passed";
    public string Details { get; set; } = "3-Way Match Passed cleanly.";
}

public class StockTransfer
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TransferNumber { get; set; } = string.Empty;
    public string Date { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");
    public string SourceWarehouseId { get; set; } = string.Empty;
    public string DestinationWarehouseId { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public string Reason { get; set; } = "Transfer to Manufacturing Raw Materials Warehouse";
    public string Status { get; set; } = "Completed";
    public string? CompanyId { get; set; }
}

// ─── Sales Order Submodule ───────────────────────────────────────────────────
public enum SalesOrderStatus { Draft, Confirmed, Invoiced, Cancelled }

public class SalesOrderLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public Guid? TaxCodeId { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal => Quantity * UnitPrice;
    public decimal LineTotalAfterDiscount => LineTotal - DiscountAmount;
    public decimal LineTotalWithTax => LineTotalAfterDiscount + TaxAmount;
}

public class SalesOrder
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string OrderNumber { get; set; }
    public Guid CustomerId { get; set; }
    public DateOnly OrderDate { get; set; }
    public DateOnly? ExpectedDeliveryDate { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public string? Terms { get; set; }
    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.Draft;
    public List<SalesOrderLine> Lines { get; set; } = [];
    public decimal SubTotal => Lines.Sum(l => l.LineTotal);
    public decimal DiscountTotal => Lines.Sum(l => l.DiscountAmount);
    public decimal TaxTotal => Lines.Sum(l => l.TaxAmount);
    public decimal TotalAmount => Lines.Sum(l => l.LineTotalWithTax);
    public Guid? ConvertedToInvoiceId { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record SalesOrderLineRequest(Guid? ProductId, string Description, decimal Quantity, decimal UnitPrice, decimal DiscountAmount, Guid? TaxCodeId, decimal TaxAmount);

public record SalesOrderRequest(
    string? OrderNumber,
    Guid CustomerId,
    DateOnly OrderDate,
    DateOnly? ExpectedDeliveryDate,
    string? Reference,
    string? Notes,
    string? Terms,
    List<SalesOrderLineRequest> Lines,
    Guid? CompanyId
);

public record SalesOrderStatusRequest(SalesOrderStatus Status);

// ─── Credit Notes Submodule ──────────────────────────────────────────────────
public enum CreditNoteStatus { Draft, Posted, Void }

public class CreditNoteLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public Guid? TaxCodeId { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal => Quantity * UnitPrice;
    public decimal LineTotalAfterDiscount => LineTotal - DiscountAmount;
    public decimal LineTotalWithTax => LineTotalAfterDiscount + TaxAmount;
}

public class CreditNote
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string CreditNoteNumber { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? OriginalInvoiceId { get; set; }
    public DateOnly CreditNoteDate { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public CreditNoteStatus Status { get; set; } = CreditNoteStatus.Draft;
    public List<CreditNoteLine> Lines { get; set; } = [];
    public decimal SubTotal => Lines.Sum(l => l.LineTotal);
    public decimal DiscountTotal => Lines.Sum(l => l.DiscountAmount);
    public decimal TaxTotal => Lines.Sum(l => l.TaxAmount);
    public decimal TotalAmount => Lines.Sum(l => l.LineTotalWithTax);
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record CreditNoteLineRequest(Guid? ProductId, string Description, decimal Quantity, decimal UnitPrice, decimal DiscountAmount, Guid? TaxCodeId, decimal TaxAmount);

public record CreditNoteRequest(
    string? CreditNoteNumber,
    Guid CustomerId,
    Guid? OriginalInvoiceId,
    DateOnly CreditNoteDate,
    string? Reference,
    string? Notes,
    List<CreditNoteLineRequest> Lines,
    Guid? CompanyId
);

public record CreditNoteStatusRequest(CreditNoteStatus Status);

// ─── Customer Payments (Receipts) ──────────────────────────────────────────────
public enum CustomerPaymentStatus { Draft, Posted, Void }
public enum PaymentMethodType { Cash, Cheque, BankTransfer, ACH, WireTransfer, BACS, FasterPayments, SEPA, CreditCard, DebitCard, OnlineBanking, MobilePayment, PayPal, DirectDebit, Other }

public class CustomerPayment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ReceiptNumber { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? InvoiceId { get; set; }           // optional: payment against specific invoice
    public DateOnly PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethodType PaymentMethod { get; set; } = PaymentMethodType.Cash;
    public string? BankAccountName { get; set; }   // bank account name when method = Bank
    public Guid? DepositToAccountId { get; set; }  // Chart-of-Account: Cash or Bank account receiving money
    public string? Reference { get; set; }         // cheque #, transaction ref, etc.
    public string? Memo { get; set; }
    public CustomerPaymentStatus Status { get; set; } = CustomerPaymentStatus.Draft;
    public Guid? JournalEntryId { get; set; }      // linked double-entry journal
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record CustomerPaymentRequest(
    Guid CustomerId,
    Guid? InvoiceId,
    DateOnly PaymentDate,
    decimal Amount,
    PaymentMethodType PaymentMethod = PaymentMethodType.Cash,
    string? BankAccountName = null,
    Guid? DepositToAccountId = null,
    string? Reference = null,
    string? Memo = null,
    Guid? CompanyId = null
);

// ─── Vouchers (BPV/BRV/CPV/CRV/JV) ─────────────────────────────────────────────
public enum VoucherType { BPV, BRV, CPV, CRV, JV }

public class Voucher
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string VoucherNumber { get; set; }
    public VoucherType Type { get; set; }
    public DateOnly Date { get; set; }
    public string AccountName { get; set; } = "";
    public Guid? AccountId { get; set; }
    public string PartyType { get; set; } = "General Ledger";
    public string PartyName { get; set; } = "";
    public string PaymentMode { get; set; } = "";
    public string? ChequeNumber { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Narration { get; set; } = "";
    public string Status { get; set; } = "Posted";
    public Guid? JournalEntryId { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public record VoucherRequest(
    VoucherType Type,
    DateOnly Date,
    string? AccountName,
    string? PartyType,
    string? PartyName,
    string? PaymentMode,
    string? ChequeNumber,
    decimal Amount,
    string? Currency,
    string? Narration,
    Guid? CompanyId = null
);

// ─── Expense Claims ────────────────────────────────────────────────────────────
public enum ExpenseClaimStatus { Draft, Submitted, Approved, Rejected, Paid }

public class ExpenseClaimLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? AccountId { get; set; }
    public string Category { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
}

public class ExpenseClaim
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ClaimNumber { get; set; }
    public string EmployeeName { get; set; } = "";
    public string Department { get; set; } = "";
    public DateOnly Date { get; set; }
    public ExpenseClaimStatus Status { get; set; } = ExpenseClaimStatus.Draft;
    public List<ExpenseClaimLine> Lines { get; set; } = [];
    public decimal TotalAmount => Lines.Sum(l => l.Amount);
    public string Currency { get; set; } = "USD";
    public string? Notes { get; set; }
    public Guid? JournalEntryId { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record ExpenseClaimLineRequest(
    Guid? AccountId,
    string? Category,
    string? Description,
    decimal Amount,
    string? Currency = null
);

public record ExpenseClaimRequest(
    string? EmployeeName,
    string? Department,
    DateOnly Date,
    List<ExpenseClaimLineRequest> Lines,
    string? Currency,
    string? Notes,
    Guid? CompanyId = null
);

public record ExpenseClaimStatusRequest(ExpenseClaimStatus Status);

// ─── Bank Statement Imports ───────────────────────────────────────────────────
public class BankStatementImport
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? BankAccountId { get; set; }
    public string FileName { get; set; } = "Manual statement import";
    public string Format { get; set; } = "CSV";
    public int TransactionCount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Imported";
    public Guid? CompanyId { get; set; }
    public DateTime ImportedAt { get; init; } = DateTime.UtcNow;
}

public record BankStatementImportRequest(
    Guid? BankAccountId,
    string? FileName,
    string? Format,
    int TransactionCount,
    decimal TotalAmount,
    Guid? CompanyId = null
);
