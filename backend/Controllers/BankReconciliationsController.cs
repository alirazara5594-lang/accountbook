using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/bank-reconciliations")]
public class BankReconciliationsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetReconciliations([FromQuery] Guid? companyId)
    {
        var query = store.Reconciliations
            .Where(r => companyId == null || r.CompanyId == companyId)
            .OrderByDescending(r => r.StatementDate)
            .Select(r => new
            {
                r.Id,
                r.BankAccountId,
                BankAccountName = store.Accounts.FirstOrDefault(a => a.Id == r.BankAccountId)?.Name,
                BankAccountCode = store.Accounts.FirstOrDefault(a => a.Id == r.BankAccountId)?.Code,
                Date = r.StatementDate.ToString("yyyy-MM-dd"),
                r.StatementBalance,
                r.GlBalance,
                r.Difference,
                Status = r.Status.ToString(),
                r.Memo,
                r.CreatedAt
            });
        return Ok(query);
    }

    [HttpGet("accounts")]
    public IActionResult GetReconcilableAccounts()
    {
        var cashParent = store.Accounts.FirstOrDefault(a => a.Code == "11100");
        var bankParent = store.Accounts.FirstOrDefault(a => a.Code == "11200");
        var cashParentId = cashParent?.Id;
        var bankParentId = bankParent?.Id;

        var accounts = store.Accounts
            .Where(a => a.Status == AccountStatus.Active && a.Type == AccountType.Asset &&
                (a.ParentId == cashParentId || a.ParentId == bankParentId ||
                 a.Name.Contains("Cash", StringComparison.OrdinalIgnoreCase) ||
                 a.Name.Contains("Bank", StringComparison.OrdinalIgnoreCase)))
            .OrderBy(a => a.Code)
            .Select(a => new { a.Id, a.Code, a.Name });

        return Ok(accounts);
    }

    [HttpPost]
    public IActionResult CreateReconciliation([FromBody] BankReconciliationRequest request)
    {
        if (!store.CreateBankReconciliation(request, out var reconciliation, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/bank-reconciliations/{reconciliation!.Id}", reconciliation);
    }
}