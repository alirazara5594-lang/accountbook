using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/expense-claims")]
public class ExpenseClaimsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetClaims([FromQuery] Guid? companyId)
    {
        var claims = store.ExpenseClaims
            .Where(c => companyId == null || c.CompanyId == companyId)
            .OrderByDescending(c => c.Date)
            .ThenByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.ClaimNumber,
                c.EmployeeName,
                c.Department,
                Date = c.Date.ToString("yyyy-MM-dd"),
                Status = c.Status.ToString(),
                c.TotalAmount,
                c.Currency,
                c.Notes,
                c.JournalEntryId,
                c.CompanyId,
                c.CreatedAt,
                Lines = c.Lines.Select(l => new
                {
                    l.Id,
                    l.AccountId,
                    AccountCode = l.AccountId.HasValue ? store.Accounts.FirstOrDefault(a => a.Id == l.AccountId.Value)?.Code : null,
                    AccountName = l.AccountId.HasValue ? store.Accounts.FirstOrDefault(a => a.Id == l.AccountId.Value)?.Name : null,
                    l.Category,
                    l.Description,
                    l.Amount,
                    l.Currency
                })
            });
        return Ok(claims);
    }

    [HttpPost]
    public IActionResult CreateClaim([FromBody] ExpenseClaimRequest request)
    {
        if (!store.CreateExpenseClaim(request, out var claim, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/expense-claims/{claim!.Id}", claim);
    }

    [HttpPatch("{id:guid}/status")]
    public IActionResult SetStatus(Guid id, [FromBody] ExpenseClaimStatusRequest request)
    {
        if (!store.SetExpenseClaimStatus(id, request.Status, out var claim, out var error))
            return BadRequest(new { Error = error });
        return Ok(claim);
    }
}
