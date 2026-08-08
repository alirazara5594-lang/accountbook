using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
public class DashboardController(AccountingStore store) : ControllerBase
{
    [HttpGet] public IActionResult Get() => Ok(new { activeAccounts = store.Accounts.Count(x => x.Status == Models.AccountStatus.Active), bankBalance = store.Accounts.Where(x => x.Type == Models.AccountType.Asset && x.ReconciliationEnabled).Sum(x => x.OpeningBalance), receivables = store.Accounts.Where(x => x.Name.Contains("Receivable")).Sum(x => x.OpeningBalance), entries = store.Entries.Count });
}
