using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

[ApiController]
[Route("api/v1/estimates")]
public class EstimatesController : ControllerBase
{
    private readonly AccountingStore _store;
    public EstimatesController(AccountingStore store) => _store = store;

    [HttpGet]
    public IActionResult GetAll([FromQuery] Guid? companyId)
    {
        var estimates = _store.Estimates
            .Where(e => companyId == null || e.CompanyId == companyId)
            .OrderByDescending(e => e.EstimateDate)
            .Select(e => new {
                e.Id, e.EstimateNumber, e.CustomerId,
                CustomerName = _store.Customers.FirstOrDefault(c => c.Id == e.CustomerId)?.Name ?? "Unknown",
                e.EstimateDate, e.ExpiryDate, e.Status,
                e.SubTotal, e.TotalDiscount, e.TotalTax, e.TotalAmount,
                e.Reference, e.ConvertedToInvoiceId
            });
        return Ok(estimates);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var e = _store.Estimates.FirstOrDefault(x => x.Id == id);
        if (e == null) return NotFound();
        return Ok(e);
    }

    [HttpPost]
    public IActionResult Create([FromBody] EstimateRequest request)
    {
        if (!_store.CreateEstimate(request, out var estimate, out var error))
            return BadRequest(new { error });
        return Created($"/api/v1/estimates/{estimate!.Id}", estimate);
    }

    [HttpPatch("{id}/status")]
    public IActionResult UpdateStatus(Guid id, [FromBody] EstimateStatusRequest request)
    {
        if (!_store.UpdateEstimateStatus(id, request.Status, out var error))
            return BadRequest(new { error });
        return Ok();
    }

    [HttpPost("{id}/convert-to-invoice")]
    public IActionResult ConvertToInvoice(Guid id, [FromBody] ConvertToInvoiceRequest request)
    {
        if (!_store.ConvertEstimateToInvoice(id, request.InvoiceDate, request.DueDate, out var invoice, out var error))
            return BadRequest(new { error });
        return Ok(new { message = "Invoice created successfully.", invoiceId = invoice!.Id });
    }
}

public record ConvertToInvoiceRequest(DateOnly InvoiceDate, DateOnly DueDate);
