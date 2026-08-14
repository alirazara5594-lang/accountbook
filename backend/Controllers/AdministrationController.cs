using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/administration")]
public class AdministrationController : ControllerBase
{
    private readonly AccountingStore _store;
    public AdministrationController(AccountingStore store) => _store = store;

    [HttpGet("dashboard")]
    public ActionResult<object> GetDashboard() => Ok(_store.GetAdministrationDashboard());

    // ── Users ────────────────────────────────────────────────────────────────
    [HttpGet("users")]
    public ActionResult<List<AdminUser>> GetUsers([FromQuery] UserStatus? status, [FromQuery] string? role, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetAdminUsers(status, role, companyId));
    }

    [HttpPost("users")]
    public ActionResult<AdminUser> CreateUser([FromBody] AdminUserRequest request)
    {
        if (!_store.CreateAdminUser(request, out var user, out var error))
            return BadRequest(new { error });
        return Created("", user!);
    }

    [HttpPut("users/{id}")]
    public ActionResult<AdminUser> UpdateUser(Guid id, [FromBody] AdminUserRequest request)
    {
        if (!_store.UpdateAdminUser(id, request, out var user, out var error))
            return BadRequest(new { error });
        return Ok(user!);
    }

    [HttpPost("users/{id}/status")]
    public ActionResult<AdminUser> SetUserStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<UserStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetAdminUserStatus(id, status, out var user, out var error))
            return BadRequest(new { error });
        return Ok(user!);
    }

    [HttpDelete("users/{id}")]
    public ActionResult DeleteUser(Guid id)
    {
        if (!_store.DeleteAdminUser(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }

    // ── Roles ────────────────────────────────────────────────────────────────
    [HttpGet("roles")]
    public ActionResult<List<UserRole>> GetRoles([FromQuery] Guid? companyId)
    {
        return Ok(_store.GetUserRoles(companyId));
    }

    [HttpPost("roles")]
    public ActionResult<UserRole> CreateRole([FromBody] UserRoleRequest request)
    {
        if (!_store.CreateUserRole(request, out var role, out var error))
            return BadRequest(new { error });
        return Created("", role!);
    }

    [HttpPut("roles/{id}")]
    public ActionResult<UserRole> UpdateRole(Guid id, [FromBody] UserRoleRequest request)
    {
        if (!_store.UpdateUserRole(id, request, out var role, out var error))
            return BadRequest(new { error });
        return Ok(role!);
    }

    [HttpDelete("roles/{id}")]
    public ActionResult DeleteRole(Guid id)
    {
        if (!_store.DeleteUserRole(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }

    // ── Branches ─────────────────────────────────────────────────────────────
    [HttpGet("branches")]
    public ActionResult<List<Branch>> GetBranches([FromQuery] bool? active, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetBranches(active, companyId));
    }

    [HttpPost("branches")]
    public ActionResult<Branch> CreateBranch([FromBody] BranchRequest request)
    {
        if (!_store.CreateBranch(request, out var branch, out var error))
            return BadRequest(new { error });
        return Created("", branch!);
    }

    [HttpPost("branches/{id}/status")]
    public ActionResult<Branch> SetBranchStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!bool.TryParse(request.Status, out var active))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetBranchStatus(id, active, out var branch, out var error))
            return BadRequest(new { error });
        return Ok(branch!);
    }

    [HttpDelete("branches/{id}")]
    public ActionResult DeleteBranch(Guid id)
    {
        if (!_store.DeleteBranch(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }

    // ── Approval Workflows ───────────────────────────────────────────────────
    [HttpGet("workflows")]
    public ActionResult<List<ApprovalWorkflow>> GetWorkflows([FromQuery] bool? active, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetApprovalWorkflows(active, companyId));
    }

    [HttpPost("workflows")]
    public ActionResult<ApprovalWorkflow> CreateWorkflow([FromBody] ApprovalWorkflowRequest request)
    {
        if (!_store.CreateApprovalWorkflow(request, out var workflow, out var error))
            return BadRequest(new { error });
        return Created("", workflow!);
    }

    [HttpPost("workflows/{id}/status")]
    public ActionResult<ApprovalWorkflow> SetWorkflowStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!bool.TryParse(request.Status, out var active))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetApprovalWorkflowStatus(id, active, out var workflow, out var error))
            return BadRequest(new { error });
        return Ok(workflow!);
    }

    [HttpDelete("workflows/{id}")]
    public ActionResult DeleteWorkflow(Guid id)
    {
        if (!_store.DeleteApprovalWorkflow(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }

    // ── Number Series ────────────────────────────────────────────────────────
    [HttpGet("number-series")]
    public ActionResult<List<NumberSeries>> GetNumberSeries([FromQuery] bool? active, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetNumberSeries(active, companyId));
    }

    [HttpPost("number-series")]
    public ActionResult<NumberSeries> CreateNumberSeries([FromBody] NumberSeriesRequest request)
    {
        if (!_store.CreateNumberSeries(request, out var series, out var error))
            return BadRequest(new { error });
        return Created("", series!);
    }

    [HttpPost("number-series/{id}/status")]
    public ActionResult<NumberSeries> SetNumberSeriesStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!bool.TryParse(request.Status, out var active))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetNumberSeriesStatus(id, active, out var series, out var error))
            return BadRequest(new { error });
        return Ok(series!);
    }

    [HttpDelete("number-series/{id}")]
    public ActionResult DeleteNumberSeries(Guid id)
    {
        if (!_store.DeleteNumberSeries(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }

    // ── Currencies ───────────────────────────────────────────────────────────
    [HttpGet("currencies")]
    public ActionResult<List<Currency>> GetCurrencies([FromQuery] bool? active, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetCurrencies(active, companyId));
    }

    [HttpPost("currencies")]
    public ActionResult<Currency> CreateCurrency([FromBody] CurrencyRequest request)
    {
        if (!_store.CreateCurrency(request, out var currency, out var error))
            return BadRequest(new { error });
        return Created("", currency!);
    }

    [HttpPost("currencies/{id}/status")]
    public ActionResult<Currency> SetCurrencyStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!bool.TryParse(request.Status, out var active))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetCurrencyStatus(id, active, out var currency, out var error))
            return BadRequest(new { error });
        return Ok(currency!);
    }

    [HttpDelete("currencies/{id}")]
    public ActionResult DeleteCurrency(Guid id)
    {
        if (!_store.DeleteCurrency(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }
}