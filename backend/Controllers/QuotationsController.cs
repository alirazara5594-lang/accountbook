using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/quotations")]
public class QuotationsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult Get([FromQuery] string? search, [FromQuery] QuotationStatus? status, [FromQuery] Guid? customerId, [FromQuery] Guid? companyId)
    {
        var result = store.Quotations.Where(q =>
            (status is null || q.Status == status) &&
            (customerId is null || q.CustomerId == customerId) &&
            (companyId is null || q.CompanyId == null || q.CompanyId == companyId) &&
            (string.IsNullOrWhiteSpace(search) ||
             q.QuoteNumber.Contains(search, StringComparison.OrdinalIgnoreCase) ||
             q.CustomerName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
             q.Items.Any(i => i.Description.Contains(search, StringComparison.OrdinalIgnoreCase)))
        ).OrderByDescending(q => q.CreatedAt);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetOne(Guid id) => store.FindQuotation(id) is { } q ? Ok(q) : NotFound();

    [HttpGet("next-number")]
    public IActionResult NextNumber() => Ok(new { quoteNumber = store.NextQuotationNumber() });

    [HttpPost]
    public IActionResult Create(QuotationRequest request)
    {
        if (store.CreateQuotation(request, out var quotation, out var error))
        {
            return CreatedAtAction(nameof(GetOne), new { id = quotation!.Id }, quotation);
        }
        return BadRequest(new { message = error });
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, QuotationRequest request)
    {
        if (store.UpdateQuotation(id, request, out var quotation, out var error))
        {
            return Ok(quotation);
        }
        return BadRequest(new { message = error });
    }

    [HttpPatch("{id:guid}/status")]
    public IActionResult SetStatus(Guid id, QuotationStatusRequest request)
    {
        if (store.SetQuotationStatus(id, request.Status, out var error))
        {
            return Ok(store.FindQuotation(id));
        }
        return BadRequest(new { message = error });
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        if (store.DeleteQuotation(id, out var error))
        {
            return NoContent();
        }
        return BadRequest(new { message = error });
    }
}
