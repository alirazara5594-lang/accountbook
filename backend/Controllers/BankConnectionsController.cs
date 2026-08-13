using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/bank-connections")]
public class BankConnectionsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetConnections([FromQuery] Guid? companyId) => Ok(store.GetBankConnections(companyId));

    [HttpPost("{accountId:guid}/sync")]
    public IActionResult Sync(Guid accountId)
    {
        if (!store.SyncBankConnection(accountId, out var account, out var error))
            return BadRequest(new { Error = error });
        return Ok(account);
    }
}
