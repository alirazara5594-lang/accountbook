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
        return Ok(query);
    }

    [HttpPost("{id}/dispose")]
    public IActionResult DisposeAsset(Guid id, [FromBody] AssetDisposalRequest request)
    {
        if (!_store.DisposeAsset(id, request.DisposalDate, request.Proceeds, request.AssetAccountId, request.AccumDeprAccountId, request.GainLossAccountId, request.CashAccountId, out var error))
            return BadRequest(new { error });
        return Ok(new { message = "Asset disposed and journal posted." });
    }
}

public record AssetDisposalRequest(DateOnly DisposalDate, decimal Proceeds, Guid? AssetAccountId, Guid? AccumDeprAccountId, Guid? GainLossAccountId, Guid? CashAccountId);
