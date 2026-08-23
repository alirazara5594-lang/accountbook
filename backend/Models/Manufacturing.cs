using System;
using System.Collections.Generic;

namespace Zenabook.Api.Models
{
    public class BillOfMaterials
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string BomNumber { get; set; } = string.Empty;
        public string FinishedProductId { get; set; } = string.Empty;
        public string FinishedProductName { get; set; } = string.Empty;
        public decimal QuantityProduced { get; set; } = 1;
        public decimal EstimatedLaborHours { get; set; } = 0;
        public decimal EstimatedMachineHours { get; set; } = 0;
        public string? Notes { get; set; }
        public string? CompanyId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<BomLine> Lines { get; set; } = new();
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
        public DateTime InspectionDate { get; set; } = DateTime.UtcNow;
        public string InspectorName { get; set; } = string.Empty;
        public decimal QuantityInspected { get; set; } = 0;
        public decimal QuantityPassed { get; set; } = 0;
        public decimal QuantityRejected { get; set; } = 0;
        public decimal ScrapCost { get; set; } = 0;
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
        public string? CompletionDate { get; set; }

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

        // Cost Accounting Elements (IAS 2)
        public decimal TotalMaterialCost { get; set; } = 0;
        public decimal DirectLaborCost { get; set; } = 0;
        public decimal OverheadCost { get; set; } = 0;
        public decimal TotalCost { get; set; } = 0;
        public decimal UnitCost { get; set; } = 0;

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
