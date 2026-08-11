using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/credit-notes")]
public class CreditNotesController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult Get([FromQuery] Guid? companyId)
    {
        var list = store.CreditNotes;
        if (companyId.HasValue)
        {
            list = [.. list.Where(o => o.CompanyId == companyId.Value)];
        }
        return Ok(list.OrderByDescending(o => o.CreditNoteDate).ThenByDescending(o => o.CreditNoteNumber));
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetOne(Guid id)
    {
        var creditNote = store.CreditNotes.FirstOrDefault(o => o.Id == id);
        return creditNote is not null ? Ok(creditNote) : NotFound();
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreditNoteRequest request)
    {
        if (request.Lines == null || request.Lines.Count == 0)
        {
            return BadRequest(new { error = "Credit Note must have at least one line." });
        }

        if (store.CreateCreditNote(request, out var creditNote, out var error))
        {
            return CreatedAtAction(nameof(GetOne), new { id = creditNote.Id }, creditNote);
        }

        return BadRequest(new { error });
    }

    [HttpPost("{id:guid}/post")]
    public IActionResult PostCreditNote(Guid id, [FromQuery] Guid? arAccountId, [FromQuery] Guid? revenueAccountId, [FromQuery] Guid? taxLiabilityAccountId)
    {
        if (store.PostCreditNote(id, arAccountId, revenueAccountId, taxLiabilityAccountId, out var error))
        {
            return Ok(new { message = "Credit Note posted successfully to general ledger." });
        }
        return BadRequest(new { error });
    }

    [HttpPost("{id:guid}/void")]
    public IActionResult VoidCreditNote(Guid id)
    {
        if (store.VoidCreditNote(id, out var error))
        {
            return Ok(new { message = "Credit Note voided and ledger allocations reversed." });
        }
        return BadRequest(new { error });
    }
}
