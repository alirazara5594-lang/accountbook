using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/fixedassets")]
public class FixedAssetsController : ControllerBase
{
    private readonly AccountingStore _store;

    public FixedAssetsController(AccountingStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<IEnumerable<FixedAsset>> GetFixedAssets([FromQuery] Guid? companyId)
    {
        var query = _store.FixedAssets.AsEnumerable();
        if (companyId.HasValue)
            query = query.Where(a => a.CompanyId == companyId.Value);
        return Ok(query.OrderByDescending(a => a.CreatedAt));
    }

    [HttpGet("{id}")]
    public IActionResult GetFixedAsset(Guid id)
    {
        var asset = _store.FixedAssets.FirstOrDefault(a => a.Id == id);
        if (asset == null) return NotFound(new { message = "Asset not found" });
        return Ok(asset);
    }

    [HttpPost]
    public IActionResult CreateFixedAsset([FromBody] FixedAsset asset)
    {
        if (!_store.CreateFixedAsset(asset, out var error))
            return BadRequest(new { error });
        return Ok(asset);
    }

    [HttpPut("{id}")]
    public IActionResult UpdateFixedAsset(Guid id, [FromBody] FixedAsset asset)
    {
        if (!_store.UpdateFixedAsset(id, asset, out var error))
            return BadRequest(new { error });
        return Ok(asset);
    }

    [HttpPost("{id}/maintenance")]
    public IActionResult LogMaintenance(Guid id, [FromBody] AssetMaintenanceRecord record)
    {
        if (!_store.LogAssetMaintenance(id, record, out var error))
            return BadRequest(new { error });
        return Ok(new { message = "Maintenance record logged successfully.", record });
    }

    [HttpPost("{id}/transfer")]
    public IActionResult TransferAsset(Guid id, [FromBody] AssetTransferRecord transfer)
    {
        if (!_store.TransferAsset(id, transfer, out var error))
            return BadRequest(new { error });
        return Ok(new { message = "Asset transfer recorded successfully.", transfer });
    }

    [HttpPost("{id}/machine-status")]
    public IActionResult UpdateMachineStatus(Guid id, [FromBody] MachineStatusUpdateRequest request)
    {
        if (!_store.UpdateMachineStatus(id, request.Status, request.CurrentMeterHours, out var error))
            return BadRequest(new { error });
        return Ok(new { message = "Machine health status updated." });
    }

    [HttpPost("{id}/run-depreciation")]
    public IActionResult RunDepreciation(Guid id, [FromBody] DepreciationRequest request)
    {
        if (!_store.RunDepreciation(id, request.DepreciationExpenseAccountId, request.AccumulatedDepreciationAccountId, out var error))
            return BadRequest(new { error });
        return Ok(new { message = "Depreciation posted to the general ledger." });
    }

    [HttpPost("run-batch-depreciation")]
    public IActionResult RunBatchDepreciation([FromQuery] DateOnly? asOfDate)
    {
        if (!_store.RunBatchDepreciation(asOfDate, out var results, out var error))
            return BadRequest(new { error });
        return Ok(new { message = $"Depreciation posted for {results.Count} assets.", results });
    }

    [HttpPost("{id}/dispose")]
    public IActionResult DisposeAsset(Guid id, [FromBody] AssetDisposalRequest request)
    {
        if (!_store.DisposeAsset(id, request.DisposalDate, request.Proceeds, request.AssetAccountId, request.AccumDeprAccountId, request.GainLossAccountId, request.CashAccountId, out var error))
            return BadRequest(new { error });
        return Ok(new { message = "Asset disposed and journal posted." });
    }
}

public record DepreciationRequest(Guid? DepreciationExpenseAccountId, Guid? AccumulatedDepreciationAccountId);

public record AssetDisposalRequest(DateOnly DisposalDate, decimal Proceeds, Guid? AssetAccountId, Guid? AccumDeprAccountId, Guid? GainLossAccountId, Guid? CashAccountId);

public record MachineStatusUpdateRequest(MachineStatus Status, decimal CurrentMeterHours);

