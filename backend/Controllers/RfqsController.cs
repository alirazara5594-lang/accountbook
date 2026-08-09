using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/rfqs")]
public class RfqsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetRfqs([FromQuery] Guid? companyId)
    {
        var query = store.RequestForQuotations.AsEnumerable();
        if (companyId.HasValue) query = query.Where(a => a.CompanyId == companyId.Value);
        return Ok(query);
    }

    [HttpPost]
    public IActionResult CreateRfq([FromBody] RfqRequest request, [FromQuery] Guid companyId)
    {
        if (store.CreateRfq(request, companyId, out var rfq, out var error))
        {
            return Ok(rfq);
        }
        return BadRequest(new { Error = error });
    }

    [HttpGet("{id}/quotes")]
    public IActionResult GetQuotes(Guid id)
    {
        return Ok(store.VendorQuotes.Where(x => x.RequestForQuotationId == id));
    }

    [HttpPost("{id}/quotes")]
    public IActionResult SubmitQuote(Guid id, [FromBody] VendorQuoteRequest request)
    {
        if (store.SubmitVendorQuote(request, out var quote, out var error))
        {
            return Ok(quote);
        }
        return BadRequest(new { Error = error });
    }

    [HttpPost("{id}/quotes/{quoteId}/award")]
    public IActionResult AwardQuote(Guid id, Guid quoteId)
    {
        if (store.AwardQuote(id, quoteId, out var error))
        {
            return NoContent();
        }
        return BadRequest(new { Error = error });
    }
}
