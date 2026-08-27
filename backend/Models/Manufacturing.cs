using System;
using System.Collections.Generic;

namespace Zenabook.Api.Models
{
    public enum BomStatus
    {
        Draft = 0,
        Approved = 1,
        Archived = 2
    }

    public enum BomCategory
    {
        Discrete = 0,
        Process = 1,
        Assembly = 2,
        CustomJob = 3
    }

    public class RoutingOperation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public int Sequence { get; set; } = 10;
        public string OperationName { get; set; } = string.Empty;
        public string WorkCenterName { get; set; } = string.Empty;
        public decimal SetupMinutes { get; set; } = 0;
        public decimal RunMinutesPerUnit { get; set; } = 0;
        public decimal LaborHourlyRate { get; set; } = 20m;
        public decimal MachineHourlyRate { get; set; } = 25m;
        public string? Notes { get; set; }
    }

    public class BillOfMaterials
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string BomNumber { get; set; } = string.Empty;
        public string Version { get; set; } = "v1.0";
        public BomStatus Status { get; set; } = BomStatus.Approved;
        public BomCategory Category { get; set; } = BomCategory.Discrete;
        public string FinishedProductId { get; set; } = string.Empty;
        public string FinishedProductName { get; set; } = string.Empty;
        public decimal QuantityProduced { get; set; } = 1;
        public decimal BatchSize { get; set; } = 1;
        public decimal YieldPercentage { get; set; } = 100;
        public decimal EstimatedLaborHours { get; set; } = 0;
        public decimal EstimatedMachineHours { get; set; } = 0;
        public decimal StandardLaborRate { get; set; } = 20m;
        public decimal StandardMachineRate { get; set; } = 25m;
        public decimal ExpectedUnitCost { get; set; } = 0;
        public string? Notes { get; set; }
        public string? CompanyId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<BomLine> Lines { get; set; } = new();
        public List<RoutingOperation> Operations { get; set; } = new();
    }

    public class BomLine
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string BomId { get; set; } = string.Empty;
        public string RawMaterialProductId { get; set; } = string.Empty;
        public string RawMaterialProductName { get; set; } = string.Empty;
        public string UnitOfMeasure { get; set; } = "Pcs";
        public decimal QuantityRequired { get; set; } = 1;
        public decimal WastePercentage { get; set; } = 0;
        public decimal StandardUnitCost { get; set; } = 0;
    }

    public enum WorkOrderStatus
    {
        Draft = 0,
        Released = 1,
        InProgress = 2,
        Completed = 3,
        Cancelled = 4
    }

    public enum QcInspectionStatus
    {
        Pending = 0,
        Passed = 1,
        Failed = 2,
        ConditionalPass = 3
    }

    public class QcInspectionRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string WorkOrderId { get; set; } = string.Empty;
        public string CertificateNumber { get; set; } = string.Empty;
        public DateTime InspectionDate { get; set; } = DateTime.UtcNow;
        public string InspectorName { get; set; } = string.Empty;
        public decimal SampleQuantity { get; set; } = 0;
        public decimal QuantityInspected { get; set; } = 0;
        public decimal QuantityPassed { get; set; } = 0;
        public decimal QuantityRejected { get; set; } = 0;
        public decimal ScrapCost { get; set; } = 0;
        public string? DefectCategory { get; set; } // Tolerance, Surface, Functional, Packaging
        public string? Severity { get; set; } = "Minor"; // Minor, Major, Critical
        public string? DefectReason { get; set; }
        public QcInspectionStatus Status { get; set; } = QcInspectionStatus.Passed;
        public string? Notes { get; set; }
    }

    public class WorkOrder
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string WorkOrderNumber { get; set; } = string.Empty;
        public string BomId { get; set; } = string.Empty;
        public string FinishedProductId { get; set; } = string.Empty;
        public string FinishedProductName { get; set; } = string.Empty;
        public string RawMaterialWarehouseId { get; set; } = string.Empty;
        public string FinishedGoodsWarehouseId { get; set; } = string.Empty;
        public decimal QuantityToProduce { get; set; } = 1;
        public decimal QuantityProduced { get; set; } = 0;
        public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Draft;
        public string StartDate { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");
        public string? PlannedStartDate { get; set; }
        public string? DueDate { get; set; }
        public string? CompletionDate { get; set; }

        // Batch & Lot Traceability
        public string? BatchNumber { get; set; }
        public string? LotNumber { get; set; }

        // Customer & Sales Order linkage (Custom Job-Shop / Project Costing)
        public string? SalesOrderId { get; set; }
        public string? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? ProjectId { get; set; }

        // Factory Work Center & Machine Linkage (from Fixed Assets)
        public string? WorkCenterName { get; set; } = "CNC Machining Center";
        public Guid? MachineAssetId { get; set; }
        public string? MachineAssetTag { get; set; }
        public string? MachineAssetName { get; set; }
        public decimal MachineRunHours { get; set; } = 0;
        public decimal MachineHourlyRate { get; set; } = 25m; // $/hr MOH absorption

        // Direct Labor Tracking
        public string? AssignedTechnicianName { get; set; }
        public decimal LaborHours { get; set; } = 0;
        public decimal LaborHourlyRate { get; set; } = 20m;

        // Standard Cost Targets (IAS 2 Target Costing)
        public decimal StandardMaterialCost { get; set; } = 0;
        public decimal StandardLaborCost { get; set; } = 0;
        public decimal StandardOverheadCost { get; set; } = 0;
        public decimal StandardTotalCost { get; set; } = 0;

        // Actual Cost Accounting Elements (IAS 2)
        public decimal TotalMaterialCost { get; set; } = 0;
        public decimal DirectLaborCost { get; set; } = 0;
        public decimal OverheadCost { get; set; } = 0;
        public decimal TotalCost { get; set; } = 0;
        public decimal UnitCost { get; set; } = 0;
        public decimal CostVariance { get; set; } = 0; // Actual - Standard

        // Quality Control & Scrap
        public QcInspectionStatus QcStatus { get; set; } = QcInspectionStatus.Pending;
        public decimal AcceptedQuantity { get; set; } = 0;
        public decimal ScrapQuantity { get; set; } = 0;
        public string? ScrapReason { get; set; }
        public string? InspectorName { get; set; }
        public string? InspectionNotes { get; set; }
        public DateTime? InspectedAt { get; set; }

        public string? CompanyId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<WorkOrderLine> Lines { get; set; } = new();
        public List<QcInspectionRecord> QcHistory { get; set; } = new();
    }

    public class WorkOrderLine
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string WorkOrderId { get; set; } = string.Empty;
        public string RawMaterialProductId { get; set; } = string.Empty;
        public string RawMaterialProductName { get; set; } = string.Empty;
        public decimal QuantityRequired { get; set; } = 1;
        public decimal QuantityIssued { get; set; } = 0;
        public decimal UnitCost { get; set; } = 0;
        public decimal TotalCost { get; set; } = 0;
    }
}
