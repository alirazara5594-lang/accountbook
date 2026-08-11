using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/system")]
public class SystemController(AccountingStore store) : ControllerBase
{
    [HttpPost("reset")]
    public IActionResult ResetDatabase()
    {
        store.ResetDatabase();
        return Ok(new { message = "System database has been reset to clean default settings." });
    }
}
