using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/prepayments")]
public class PrepaymentController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<PrepaymentSchedule>> GetSchedules([FromQuery] PrepaymentType? type = null, [FromQuery] Guid? companyId = null)
    {
        return Ok(store.GetPrepaymentSchedules(type, companyId));
    }

    [HttpGet("{id}")]
    public ActionResult<PrepaymentSchedule> GetSchedule(Guid id)
    {
        var schedule = store.FindPrepaymentSchedule(id);
        if (schedule == null) return NotFound(new { error = "Schedule not found." });
        return Ok(schedule);
    }

    [HttpPost]
    public ActionResult<PrepaymentSchedule> CreateSchedule([FromBody] PrepaymentScheduleRequest request)
    {
        var actor = User?.Identity?.Name ?? "System Administrator";
        if (!store.CreatePrepaymentSchedule(request, actor, out var schedule, out var error))
        {
            return BadRequest(new { error });
        }
        return Created($"/api/v1/prepayments/{schedule!.Id}", schedule);
    }

    [HttpPost("{id}/post-line/{periodIndex}")]
    public ActionResult<JournalEntry> PostAmortizationLine(Guid id, int periodIndex)
    {
        var actor = User?.Identity?.Name ?? "System Administrator";
        if (!store.PostAmortizationLine(id, periodIndex, actor, out var entry, out var error))
        {
            return BadRequest(new { error });
        }
        return Ok(entry);
    }

    [HttpPost("batch-run")]
    public ActionResult PostBatchAmortization([FromBody] BatchAmortizationRequest request)
    {
        var actor = User?.Identity?.Name ?? "System Administrator";
        var cutoff = request.CutoffDate ?? DateOnly.FromDateTime(DateTime.Today);
        if (!store.PostBatchAmortization(cutoff, request.Type, actor, out var count, out var error))
        {
            return BadRequest(new { error });
        }
        return Ok(new { message = $"Successfully posted {count} amortization entries up to {cutoff:yyyy-MM-dd}.", postedCount = count });
    }

    [HttpDelete("{id}")]
    public ActionResult DeleteSchedule(Guid id)
    {
        if (!store.DeletePrepaymentSchedule(id, out var error))
        {
            return BadRequest(new { error });
        }
        return Ok(new { message = "Schedule deleted successfully." });
    }
}

public record BatchAmortizationRequest(DateOnly? CutoffDate, PrepaymentType? Type);
