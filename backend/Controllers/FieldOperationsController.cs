using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/field-operations")]
public class FieldOperationsController : ControllerBase
{
    private readonly AccountingStore _store;
    public FieldOperationsController(AccountingStore store) => _store = store;

    [HttpGet("dashboard")]
    public ActionResult<object> GetDashboard() => Ok(_store.GetFieldOperationsDashboard());

    // ── Surveys ──────────────────────────────────────────────────────────────
    [HttpGet("surveys")]
    public ActionResult<List<Survey>> GetSurveys([FromQuery] SurveyStatus? status, [FromQuery] string? category, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetSurveys(status, category, companyId));
    }

    [HttpPost("surveys")]
    public ActionResult<Survey> CreateSurvey([FromBody] SurveyRequest request)
    {
        if (!_store.CreateSurvey(request, out var survey, out var error))
            return BadRequest(new { error });
        return Created("", survey!);
    }

    [HttpPost("surveys/{id}/status")]
    public ActionResult<Survey> SetSurveyStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<SurveyStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetSurveyStatus(id, status, out var survey, out var error))
            return BadRequest(new { error });
        return Ok(survey!);
    }

    // ── Field Visits ─────────────────────────────────────────────────────────
    [HttpGet("visits")]
    public ActionResult<List<FieldVisit>> GetVisits([FromQuery] FieldVisitStatus? status, [FromQuery] string? visitType, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetFieldVisits(status, visitType, companyId));
    }

    [HttpPost("visits")]
    public ActionResult<FieldVisit> CreateVisit([FromBody] FieldVisitRequest request)
    {
        if (!_store.CreateFieldVisit(request, out var visit, out var error))
            return BadRequest(new { error });
        return Created("", visit!);
    }

    [HttpPost("visits/{id}/status")]
    public ActionResult<FieldVisit> SetVisitStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<FieldVisitStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetFieldVisitStatus(id, status, out var visit, out var error))
            return BadRequest(new { error });
        return Ok(visit!);
    }

    // ── Inspections ──────────────────────────────────────────────────────────
    [HttpGet("inspections")]
    public ActionResult<List<Inspection>> GetInspections([FromQuery] InspectionStatus? status, [FromQuery] string? type, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetInspections(status, type, companyId));
    }

    [HttpPost("inspections")]
    public ActionResult<Inspection> CreateInspection([FromBody] InspectionRequest request)
    {
        if (!_store.CreateInspection(request, out var inspection, out var error))
            return BadRequest(new { error });
        return Created("", inspection!);
    }

    [HttpPost("inspections/{id}/status")]
    public ActionResult<Inspection> SetInspectionStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<InspectionStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetInspectionStatus(id, status, out var inspection, out var error))
            return BadRequest(new { error });
        return Ok(inspection!);
    }

    // ── Field Work Orders ────────────────────────────────────────────────────
    [HttpGet("work-orders")]
    public ActionResult<List<FieldWorkOrder>> GetWorkOrders([FromQuery] FieldWorkOrderStatus? status, [FromQuery] string? priority, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetFieldWorkOrders(status, priority, companyId));
    }

    [HttpPost("work-orders")]
    public ActionResult<FieldWorkOrder> CreateWorkOrder([FromBody] FieldWorkOrderRequest request)
    {
        if (!_store.CreateFieldWorkOrder(request, out var order, out var error))
            return BadRequest(new { error });
        return Created("", order!);
    }

    [HttpPost("work-orders/{id}/status")]
    public ActionResult<FieldWorkOrder> SetWorkOrderStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<FieldWorkOrderStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetFieldWorkOrderStatus(id, status, out var order, out var error))
            return BadRequest(new { error });
        return Ok(order!);
    }

    // ── Field Expenses ───────────────────────────────────────────────────────
    [HttpGet("expenses")]
    public ActionResult<List<FieldExpense>> GetExpenses([FromQuery] Guid? workOrderId, [FromQuery] string? category, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetFieldExpenses(workOrderId, category, companyId));
    }

    [HttpPost("expenses")]
    public ActionResult<FieldExpense> CreateExpense([FromBody] FieldExpenseRequest request)
    {
        if (!_store.CreateFieldExpense(request, out var expense, out var error))
            return BadRequest(new { error });
        return Created("", expense!);
    }
}