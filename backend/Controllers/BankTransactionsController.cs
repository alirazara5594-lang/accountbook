using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/bank-transactions")]
public class BankTransactionsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetBankTransactions([FromQuery] Guid? bankAccountId, [FromQuery] Guid? companyId)
    {
        return Ok(store.GetBankTransactions(bankAccountId, companyId));
    }
}