using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/chart-of-accounts")]
[Route("api/v1/accounts")]
public class ChartOfAccountsController(AccountingStore store) : ControllerBase
{
    [HttpGet] public IActionResult Get([FromQuery] string? search, [FromQuery] AccountStatus? status) => Ok(store.Accounts.Where(a => (status is null || a.Status == status) && (string.IsNullOrWhiteSpace(search) || a.Name.Contains(search, StringComparison.OrdinalIgnoreCase) || a.Code.Contains(search, StringComparison.OrdinalIgnoreCase))).OrderBy(a => a.Code));
    [HttpGet("{id:guid}")] public IActionResult GetOne(Guid id) => store.Find(id) is { } a ? Ok(a) : NotFound();
    [HttpGet("next-code")] public IActionResult NextCode([FromQuery] AccountType type, [FromQuery] Guid? parentId) => Ok(new { code = store.NextCodeForParent(parentId, type) });
    [HttpGet("{id:guid}/history")] public IActionResult History(Guid id) => store.Find(id) is null ? NotFound() : Ok(store.History(id));
    [HttpPost] public IActionResult Create(AccountRequest request) { try { var a = store.Create(request); return CreatedAtAction(nameof(GetOne), new { id = a.Id }, a); } catch (Exception e) { return BadRequest(new { message = e.Message }); } }
    [HttpPut("{id:guid}")] public IActionResult Update(Guid id, AccountRequest request) => store.Update(id, request, out var error) ? Ok(store.Find(id)) : BadRequest(new { message = error });
    [HttpPatch("{id:guid}/status")] public IActionResult Status(Guid id, StatusRequest request) => store.SetStatus(id, request, out var error) ? Ok(store.Find(id)) : BadRequest(new { message = error });
    [HttpDelete("clear-all")] public IActionResult ClearAll() => store.ClearAllAccounts(out var error) ? Ok(new { message = "All accounts cleared successfully." }) : BadRequest(new { message = error });
    [HttpDelete("{id:guid}")] public IActionResult Delete(Guid id) => store.Delete(id, out var error) ? NoContent() : BadRequest(new { message = error });
}
