using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/bank-imports")]
public class BankImportsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetImports([FromQuery] Guid? companyId)
    {
        var imports = store.BankImports
            .Where(i => companyId == null || i.CompanyId == companyId)
            .OrderByDescending(i => i.ImportedAt)
            .Select(i => new
            {
                i.Id,
                i.BankAccountId,
                BankAccountName = i.BankAccountId.HasValue ? store.Accounts.FirstOrDefault(a => a.Id == i.BankAccountId.Value)?.Name : null,
                i.FileName,
                i.Format,
                i.TransactionCount,
                i.TotalAmount,
                i.Status,
                i.CompanyId,
                i.ImportedAt
            });
        return Ok(imports);
    }

    [HttpPost]
    public IActionResult CreateImport([FromBody] BankStatementImportRequest request)
    {
        if (!store.CreateBankImport(request, out var import, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/bank-imports/{import!.Id}", import);
    }
}
