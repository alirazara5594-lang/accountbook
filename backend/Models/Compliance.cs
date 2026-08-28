using System;
using System.Collections.Generic;

namespace Zenabook.Api.Models
{
    public enum TaxObligationStatus
    {
        Due = 0,
        Filed = 1,
        Paid = 2,
        Overdue = 3
    }

    public enum EInvoiceStatus
    {
        Draft = 0,
        Submitted = 1,
        Validated = 2,
        Rejected = 3
    }

    public class TaxObligation
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string ObligationNumber { get; set; } = "";
        public string JurisdictionId { get; set; } = "UK";
        public string ObligationType { get; set; } = "VAT";
        public DateOnly PeriodStart { get; set; }
        public DateOnly PeriodEnd { get; set; }
        public DateOnly DueDate { get; set; }
        public TaxObligationStatus Status { get; set; } = TaxObligationStatus.Due;
        public DateOnly? FiledDate { get; set; }
        public decimal AmountDue { get; set; }
        public decimal AmountPaid { get; set; }
        public string? Notes { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record TaxObligationRequest(
        string JurisdictionId, string ObligationType, DateOnly PeriodStart, DateOnly PeriodEnd,
        DateOnly DueDate, decimal AmountDue, string? Notes, Guid? CompanyId
    );

    public class TaxReturn
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string ReturnNumber { get; set; } = "";
        public string JurisdictionId { get; set; } = "UK";
        public string ReturnType { get; set; } = "VAT";
        public DateOnly PeriodStart { get; set; }
        public DateOnly PeriodEnd { get; set; }
        public DateOnly DueDate { get; set; }
        public DateOnly? FiledDate { get; set; }
        public string Status { get; set; } = "Draft";
        public decimal TotalSales { get; set; }
        public decimal TotalPurchases { get; set; }
        public decimal TotalExempt { get; set; }
        public decimal TotalZeroRated { get; set; }
        public decimal OutputTax { get; set; }
        public decimal InputTax { get; set; }
        public decimal NetTax => OutputTax - InputTax;
        public decimal AmountPaid { get; set; }
        public string? Reference { get; set; }
        public string? BoxesJson { get; set; }
        public Guid? SettlementJournalId { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public class WithholdingCertificate
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string CertificateNumber { get; set; } = "";
        public string CertificateType { get; set; } = "Payment";
        public string CounterpartyName { get; set; } = "";
        public string TaxId { get; set; } = "";
        public string? SectionCode { get; set; } // e.g. FBR Sec 153(1)(a) Goods, Sec 153(1)(b) Services, US 1099
        public bool IsFiler { get; set; } = true;
        public decimal RatePercent { get; set; }
        public decimal GrossAmount { get; set; }
        public decimal WithheldAmount { get; set; }
        public string? ChallanNumber { get; set; } // CPR / Bank Challan / Deposit Reference
        public string? PaymentReference { get; set; }
        public Guid? VendorId { get; set; }
        public DateOnly PeriodStart { get; set; }
        public DateOnly PeriodEnd { get; set; }
        public string Status { get; set; } = "Issued";
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record WithholdingCertificateRequest(
        string CertificateType, string CounterpartyName, string TaxId, decimal RatePercent,
        decimal GrossAmount, DateOnly PeriodStart, DateOnly PeriodEnd, string Status, Guid? CompanyId,
        string? SectionCode = null, bool? IsFiler = true, string? ChallanNumber = null, string? PaymentReference = null, Guid? VendorId = null
    );

    public class EInvoice
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string InvoiceNumber { get; set; } = "";
        public string InvoiceType { get; set; } = "Sales";
        public string CounterpartyName { get; set; } = "";
        public string? CounterpartyTaxId { get; set; }
        public DateOnly IssueDate { get; set; }
        public string? Reference { get; set; }
        public decimal GrossAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public EInvoiceStatus Status { get; set; } = EInvoiceStatus.Draft;
        public string? Uuid { get; set; }
        public string? QrCodePayload { get; set; }
        public string? CryptographicStamp { get; set; }
        public string? InvoiceHash { get; set; }
        public string? PreviousInvoiceHash { get; set; }
        public string? ZatcaStatus { get; set; } // Reported / Cleared / Rejected / NotApplicable
        public string? FbrStatus { get; set; } // Verified / Pending / Failed / NotApplicable
        public string? XmlPayload { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record EInvoiceRequest(
        string InvoiceType, string CounterpartyName, string? CounterpartyTaxId, DateOnly IssueDate,
        string? Reference, decimal GrossAmount, decimal TaxAmount, string? Uuid, Guid? CompanyId,
        string? QrCodePayload = null, string? CryptographicStamp = null, string? InvoiceHash = null,
        string? PreviousInvoiceHash = null, string? ZatcaStatus = null, string? FbrStatus = null, string? XmlPayload = null
    );
}
