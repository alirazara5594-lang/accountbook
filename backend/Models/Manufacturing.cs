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
        public decimal DirectLaborCost { get; set; } = 0;
        public decimal OverheadCost { get; set; } = 0;
        public decimal TotalMaterialCost { get; set; } = 0;
        public decimal TotalCost { get; set; } = 0;
        public decimal UnitCost { get; set; } = 0;
        public string? CompanyId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<WorkOrderLine> Lines { get; set; } = new();
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
