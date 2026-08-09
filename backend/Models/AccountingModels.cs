namespace Zenabook.Api.Models;

public enum AccountType { Asset, Liability, Equity, Revenue, Expense, ContraAsset, ContraLiability, ContraEquity, ContraRevenue, ContraExpense }
public enum AccountStatus { Active, Inactive }

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
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record AccountRequest(string? Code, string Name, AccountType Type, Guid? ParentId, decimal OpeningBalance, DateOnly? OpeningBalanceDate, bool ReconciliationEnabled, string? IfrsTag, string? GaapTag, Dictionary<string,string>? CustomFields);
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
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
public enum EntityType { Parent, Subsidiary, Branch, JointVenture, Associate }
public record CompanyRequest(string Name, string? Code, string? LegalName, EntityType Type, Guid? ParentId, string Country, string CurrencyCode);
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

public enum DiscountType { FixedAmount, Percentage }
public enum QuotationStatus { Draft, Sent, Accepted, Declined, Expired, Converted }

public class QuotationItem
{
    public required string Description { get; set; }
    public decimal Quantity { get; set; } = 1m;
    public decimal UnitPrice { get; set; } = 0m;
    public decimal Amount => Quantity * UnitPrice;
}

public class Quotation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string QuoteNumber { get; set; }
    public Guid CustomerId { get; set; }
    public required string CustomerName { get; set; }
    public Guid? CompanyId { get; set; }
    public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.Today);
    public DateOnly ExpiryDate { get; set; } = DateOnly.FromDateTime(DateTime.Today.AddDays(30));
    public string CurrencyCode { get; set; } = "USD";
    public List<QuotationItem> Items { get; set; } = [];
    public DiscountType DiscountType { get; set; } = DiscountType.FixedAmount;
    public decimal DiscountValue { get; set; } = 0m;
    public decimal TaxRatePercent { get; set; } = 0m;
    public string? Notes { get; set; }
    public string? TermsAndConditions { get; set; }
    public QuotationStatus Status { get; set; } = QuotationStatus.Draft;

    public decimal Subtotal => Items.Sum(x => x.Quantity * x.UnitPrice);
    public decimal DiscountAmount => DiscountType == DiscountType.Percentage ? Subtotal * (DiscountValue / 100m) : Math.Min(DiscountValue, Subtotal);
    public decimal TaxableAmount => Math.Max(0m, Subtotal - DiscountAmount);
    public decimal TaxAmount => TaxableAmount * (TaxRatePercent / 100m);
    public decimal Total => TaxableAmount + TaxAmount;

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record QuotationItemRequest(string Description, decimal Quantity, decimal UnitPrice);

public record QuotationRequest(
    string? QuoteNumber,
    Guid CustomerId,
    Guid? CompanyId,
    DateOnly Date,
    DateOnly ExpiryDate,
    string? CurrencyCode,
    List<QuotationItemRequest> Items,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal TaxRatePercent,
    string? Notes,
    string? TermsAndConditions);

public record QuotationStatusRequest(QuotationStatus Status, string? Reason);


