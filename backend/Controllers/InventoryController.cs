using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

[ApiController]
[Route("api/v1")]
public class InventoryController : ControllerBase
{
    private readonly AccountingStore _store;
    public InventoryController(AccountingStore store) => _store = store;

    // Warehouses
    [HttpGet("warehouses")]
    public IActionResult GetWarehouses([FromQuery] Guid? companyId)
    {
        var result = _store.Warehouses.Where(w => companyId == null || w.CompanyId == companyId).ToList();
        return Ok(result);
    }

    [HttpPost("warehouses")]
    public IActionResult CreateWarehouse([FromBody] WarehouseRequest request)
    {
        if (!_store.CreateWarehouse(request.Name, request.Location, request.CompanyId, out var warehouse, out var error))
            return BadRequest(new { error });
        return Created($"/api/v1/warehouses/{warehouse!.Id}", warehouse);
    }

    // Stock Levels
    [HttpGet("stock-levels")]
    public IActionResult GetStockLevels([FromQuery] Guid? companyId, [FromQuery] Guid? warehouseId)
    {
        var levels = _store.StockLevels
            .Where(s => companyId == null || s.CompanyId == companyId)
            .Where(s => warehouseId == null || s.WarehouseId == warehouseId)
            .ToList();

        // Enrich with product names
        var enriched = levels.Select(s =>
        {
            var product = _store.Products.FirstOrDefault(p => p.Id == s.ProductId);
            var warehouse = _store.Warehouses.FirstOrDefault(w => w.Id == s.WarehouseId);
            return new
            {
                s.Id,
                s.ProductId,
                ProductName = product?.Name ?? "Unknown",
                ProductCode = product?.Code ?? "",
                s.WarehouseId,
                WarehouseName = warehouse?.Name ?? "Unknown",
                s.QuantityOnHand,
                s.MovingAverageCost,
                TotalValue = s.QuantityOnHand * s.MovingAverageCost,
                s.CompanyId
            };
        });

        return Ok(enriched);
    }

    // Stock Transactions
    [HttpGet("stock-transactions")]
    public IActionResult GetStockTransactions([FromQuery] Guid? companyId, [FromQuery] Guid? warehouseId, [FromQuery] Guid? productId)
    {
        var txns = _store.StockTransactions
            .Where(t => companyId == null || t.CompanyId == companyId)
            .Where(t => warehouseId == null || t.WarehouseId == warehouseId)
            .Where(t => productId == null || t.ProductId == productId)
            .OrderByDescending(t => t.CreatedAt)
            .ToList();

        var enriched = txns.Select(t =>
        {
            var product = _store.Products.FirstOrDefault(p => p.Id == t.ProductId);
            var warehouse = _store.Warehouses.FirstOrDefault(w => w.Id == t.WarehouseId);
            return new
            {
                t.Id,
                t.Date,
                t.ProductId,
                ProductName = product?.Name ?? "Unknown",
                t.WarehouseId,
                WarehouseName = warehouse?.Name ?? "Unknown",
                t.Quantity,
                t.UnitCost,
                TotalValue = t.Quantity * t.UnitCost,
                Type = t.Type.ToString(),
                t.Reference,
                t.CompanyId
            };
        });

        return Ok(enriched);
    }

    [HttpPost("stock-transactions")]
    public IActionResult CreateStockTransaction([FromBody] StockTransactionRequest request)
    {
        var txn = new StockTransaction
        {
            Date = request.Date,
            ProductId = request.ProductId,
            WarehouseId = request.WarehouseId,
            Quantity = request.Quantity,
            UnitCost = request.UnitCost,
            Type = request.Type,
            Reference = request.Reference,
            CompanyId = request.CompanyId
        };

        if (!_store.CreateStockTransaction(txn, out var error))
            return BadRequest(new { error });

        return Created($"/api/v1/stock-transactions/{txn.Id}", txn);
    }

    // Depreciation
    [HttpPost("fixed-assets/{id}/run-depreciation")]
    public IActionResult RunDepreciation(Guid id, [FromBody] DepreciationRequest request)
    {
        if (!_store.RunDepreciation(id, request.DepreciationExpenseAccountId, request.AccumulatedDepreciationAccountId, out var error))
            return BadRequest(new { error });
        return Ok(new { message = "Depreciation posted successfully." });
    }
}

public record WarehouseRequest(string Name, string? Location, Guid? CompanyId);
public record StockTransactionRequest(DateOnly Date, Guid ProductId, Guid WarehouseId, decimal Quantity, decimal UnitCost, StockTransactionType Type, string? Reference, Guid? CompanyId);
public record DepreciationRequest(Guid DepreciationExpenseAccountId, Guid AccumulatedDepreciationAccountId);
