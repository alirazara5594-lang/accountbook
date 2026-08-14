using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/projects")]
public class ProjectsController : ControllerBase
{
    private readonly AccountingStore _store;
    public ProjectsController(AccountingStore store) => _store = store;

    // ── Projects ──────────────────────────────────────────────────────────────
    [HttpGet]
    public ActionResult<List<Project>> GetProjects([FromQuery] ProjectStatus? status, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetProjects(status, companyId));
    }

    [HttpGet("{id}")]
    public ActionResult<Project> GetProject(Guid id)
    {
        var project = _store.GetProjectById(id);
        return project == null ? NotFound() : Ok(project);
    }

    [HttpGet("next-number")]
    public ActionResult<object> NextProjectNumber() => Ok(new { number = _store.NextProjectNumber() });

    [HttpPost]
    public ActionResult<Project> CreateProject([FromBody] ProjectRequest request)
    {
        if (!_store.CreateProject(request, out var project, out var error))
            return BadRequest(new { error });
        return CreatedAtAction(nameof(GetProject), new { id = project!.Id }, project);
    }

    [HttpPut("{id}")]
    public ActionResult<Project> UpdateProject(Guid id, [FromBody] ProjectRequest request)
    {
        if (!_store.UpdateProject(id, request, out var project, out var error))
            return BadRequest(new { error });
        return Ok(project!);
    }

    [HttpPost("{id}/status")]
    public ActionResult<Project> SetProjectStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<ProjectStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetProjectStatus(id, status, out var project, out var error))
            return BadRequest(new { error });
        return Ok(project!);
    }

    [HttpDelete("{id}")]
    public ActionResult DeleteProject(Guid id)
    {
        if (!_store.DeleteProject(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }

    [HttpGet("{id}/dashboard")]
    public ActionResult<object> GetProjectDashboard(Guid id)
    {
        if (_store.GetProjectById(id) == null) return NotFound();
        return Ok(_store.GetProjectDashboard(id));
    }

    // ── Phases ────────────────────────────────────────────────────────────────
    [HttpGet("phases")]
    public ActionResult<List<ProjectPhase>> GetPhases([FromQuery] Guid? projectId)
    {
        return Ok(_store.GetPhases(projectId));
    }

    [HttpPost("phases")]
    public ActionResult<ProjectPhase> CreatePhase([FromBody] ProjectPhaseRequest request)
    {
        if (!_store.CreatePhase(request, out var phase, out var error))
            return BadRequest(new { error });
        return Created("", phase!);
    }

    // ── Tasks ─────────────────────────────────────────────────────────────────
    [HttpGet("tasks")]
    public ActionResult<List<ProjectTask>> GetTasks([FromQuery] Guid? projectId, [FromQuery] Guid? assigneeId, [FromQuery] ProjectTaskStatus? status)
    {
        return Ok(_store.GetTasks(projectId, assigneeId, status));
    }

    [HttpPost("tasks")]
    public ActionResult<ProjectTask> CreateTask([FromBody] ProjectTaskRequest request)
    {
        if (!_store.CreateTask(request, out var task, out var error))
            return BadRequest(new { error });
        return Created("", task!);
    }

    [HttpPut("tasks/{id}")]
    public ActionResult<ProjectTask> UpdateTask(Guid id, [FromBody] ProjectTaskRequest request)
    {
        if (!_store.UpdateTask(id, request, out var task, out var error))
            return BadRequest(new { error });
        return Ok(task!);
    }

    [HttpPost("tasks/{id}/status")]
    public ActionResult<ProjectTask> SetTaskStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<ProjectTaskStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetTaskStatus(id, status, out var task, out var error))
            return BadRequest(new { error });
        return Ok(task!);
    }

    [HttpDelete("tasks/{id}")]
    public ActionResult DeleteTask(Guid id)
    {
        if (!_store.DeleteTask(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }

    // ── Timesheets ────────────────────────────────────────────────────────────
    [HttpGet("timesheets")]
    public ActionResult<List<TimesheetEntry>> GetTimesheets([FromQuery] Guid? projectId, [FromQuery] Guid? employeeId, [FromQuery] bool? approved)
    {
        return Ok(_store.GetTimesheets(projectId, employeeId, approved));
    }

    [HttpPost("timesheets")]
    public ActionResult<TimesheetEntry> LogTimesheet([FromBody] TimesheetRequest request)
    {
        if (!_store.LogTimesheet(request, out var entry, out var error))
            return BadRequest(new { error });
        return Created("", entry!);
    }

    [HttpPost("timesheets/{id}/approve")]
    public ActionResult<TimesheetEntry> ApproveTimesheet(Guid id)
    {
        if (!_store.ApproveTimesheet(id, null, out var entry, out var error))
            return BadRequest(new { error });
        return Ok(entry!);
    }

    [HttpDelete("timesheets/{id}")]
    public ActionResult DeleteTimesheet(Guid id)
    {
        if (!_store.DeleteTimesheet(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }

    // ── Expenses ──────────────────────────────────────────────────────────────
    [HttpGet("expenses")]
    public ActionResult<List<ProjectExpense>> GetProjectExpenses([FromQuery] Guid? projectId, [FromQuery] string? category)
    {
        return Ok(_store.GetProjectExpenses(projectId, category));
    }

    [HttpPost("expenses")]
    public ActionResult<ProjectExpense> CreateProjectExpense([FromBody] ProjectExpenseRequest request)
    {
        if (!_store.CreateProjectExpense(request, out var expense, out var error))
            return BadRequest(new { error });
        return Created("", expense!);
    }

    [HttpDelete("expenses/{id}")]
    public ActionResult DeleteProjectExpense(Guid id)
    {
        if (!_store.DeleteProjectExpense(id, out var error))
            return BadRequest(new { error });
        return NoContent();
    }
}
