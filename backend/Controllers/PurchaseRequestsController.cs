using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/purchaserequests")]
public class PurchaseRequestsController : ControllerBase
{
    private readonly AccountingStore _store;

    public PurchaseRequestsController(AccountingStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<IEnumerable<PurchaseRequest>> GetPurchaseRequests([FromQuery] Guid? companyId)
    {
        var query = _store.PurchaseRequests.AsEnumerable();
        if (companyId.HasValue)
        {
            query = query.Where(a => a.CompanyId == companyId.Value);
        }
        return Ok(query);
    }

    [HttpPost]
    public ActionResult<PurchaseRequest> CreatePurchaseRequest([FromBody] PurchaseRequestRequest request, [FromQuery] Guid companyId)
    {
        if (_store.CreatePurchaseRequest(request, companyId, out var pr, out var error))
        {
            return Ok(pr);
        }
        return BadRequest(new { Error = error });
    }

    [HttpPatch("{id}/status")]
    public IActionResult UpdateStatus(Guid id, [FromBody] PurchaseRequestStatus status)
    {
        if (_store.UpdatePurchaseRequestStatus(id, status, out var error))
        {
            return NoContent();
        }
        return BadRequest(new { Error = error });
    }
}
