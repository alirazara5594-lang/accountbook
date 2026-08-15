using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/leases")]
public class LeaseController : ControllerBase
{
    private readonly AccountingStore _store;
    public LeaseController(AccountingStore store) => _store = store;

    [HttpGet]
    public ActionResult<List<LeaseAgreement>> GetLeases([FromQuery] Guid? companyId, [FromQuery] bool? active = null, [FromQuery] LeaseType? type = null)
    {
        return Ok(_store.GetLeases(companyId, active, type));
    }

    [HttpPost]
    public ActionResult<LeaseAgreement> CreateLease([FromBody] LeaseRequest request)
    {
        if (!_store.CreateLease(request, out var lease, out var error))
            return BadRequest(new { error });
        return Created("", lease!);
    }

    [HttpGet("{id}/schedule")]
    public ActionResult<LeaseScheduleResponse> GetSchedule(Guid id, [FromQuery] int months = 12)
    {
        if (!_store.GetLeaseSchedule(id, months, out var schedule, out var error))
            return BadRequest(new { error });
        return Ok(schedule!);
    }

    [HttpPost("{id}/post-accrual")]
    public ActionResult<JournalEntry> PostMonthlyAccrual(Guid id, [FromQuery] DateOnly? asOfDate = null)
    {
        if (!_store.PostLeaseAccrual(id, asOfDate ?? DateOnly.FromDateTime(DateTime.Today), out var entry, out var error))
            return BadRequest(new { error });
        return Ok(entry!);
    }
}