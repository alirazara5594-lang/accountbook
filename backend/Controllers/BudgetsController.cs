using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/budgets")]
public class BudgetsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult Get([FromQuery] Guid? companyId, [FromQuery] int? fiscalYear)
    {
        var query = store.Budgets
            .Where(b => companyId == null || b.CompanyId == companyId)
            .Where(b => fiscalYear == null || b.FiscalYear == fiscalYear)
            .Select(b => new
            {
                b.Id,
                b.BudgetName,
                b.AccountId,
                AccountCode = store.Accounts.FirstOrDefault(a => a.Id == b.AccountId)?.Code,
                AccountName = store.Accounts.FirstOrDefault(a => a.Id == b.AccountId)?.Name,
                b.Amount,
                b.FiscalYear,
                PeriodType = b.PeriodType.ToString(),
                Status = b.Status.ToString(),
                b.CompanyId,
                b.CreatedAt,
                b.UpdatedAt
            })
            .OrderBy(b => b.FiscalYear);
        return Ok(query);
    }

    [HttpPost]
    public IActionResult Create(BudgetRequest request)
    {
        if (!store.CreateBudget(request, out var budget, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/budgets/{budget!.Id}", budget);
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, BudgetRequest request)
    {
        if (!store.UpdateBudget(id, request, out var error))
            return BadRequest(new { Error = error });
        return Ok(new { message = "Budget updated." });
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        if (!store.DeleteBudget(id, out var error))
            return BadRequest(new { Error = error });
        return Ok(new { message = "Budget deleted." });
    }
}

[ApiController]
[Route("api/v1/period-closing")]
public class PeriodClosingController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult Get([FromQuery] Guid? companyId)
    {
        var query = store.PeriodCloses
            .Where(p => companyId == null || p.CompanyId == companyId)
            .OrderByDescending(p => p.PeriodEndDate ?? DateOnly.MinValue)
            .Select(p => new
            {
                p.Id,
                p.PeriodName,
                PeriodEndDate = p.PeriodEndDate?.ToString("yyyy-MM-dd"),
                Status = p.Status.ToString(),
                p.Note,
                p.CompanyId,
                p.CreatedAt,
                p.ClosedAt,
                p.ClosedBy
            });
        return Ok(query);
    }

    [HttpPost]
    public IActionResult Create(PeriodCloseRequest request)
    {
        if (!store.CreatePeriodClose(request, out var period, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/period-closing/{period!.Id}", period);
    }

    [HttpPost("{id:guid}/close")]
    public IActionResult Close(Guid id, [FromBody] ClosePeriodRequest? request)
    {
        if (!store.ClosePeriod(id, request?.ClosedBy, request?.Note, out var error))
            return BadRequest(new { Error = error });
        return Ok(new { message = "Period closed." });
    }

    [HttpPost("{id:guid}/reopen")]
    public IActionResult Reopen(Guid id)
    {
        if (!store.ReopenPeriod(id, out var error))
            return BadRequest(new { Error = error });
        return Ok(new { message = "Period reopened." });
    }
}

public record ClosePeriodRequest(string? ClosedBy = null, string? Note = null);

[ApiController]
[Route("api/v1/audit-trail")]
public class AuditTrailController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult Get([FromQuery] Guid? companyId, [FromQuery] int limit = 200)
    {
        return Ok(store.GetAuditTrail(companyId, limit));
    }
}