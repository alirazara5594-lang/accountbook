using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/compliance")]
public class ComplianceController : ControllerBase
{
    private readonly AccountingStore _store;
    public ComplianceController(AccountingStore store) => _store = store;

    [HttpGet("dashboard")]
    public ActionResult<object> GetDashboard() => Ok(_store.GetComplianceDashboard());

    // ── Obligations ──────────────────────────────────────────────────────────
    [HttpGet("obligations")]
    public ActionResult<List<TaxObligation>> GetObligations([FromQuery] string? jurisdictionId, [FromQuery] TaxObligationStatus? status, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetTaxObligations(jurisdictionId, status, companyId));
    }

    [HttpPost("obligations")]
    public ActionResult<TaxObligation> CreateObligation([FromBody] TaxObligationRequest request)
    {
        if (!_store.CreateTaxObligation(request, out var obligation, out var error))
            return BadRequest(new { error });
        return Created("", obligation!);
    }

    [HttpPost("obligations/{id}/status")]
    public ActionResult<TaxObligation> SetObligationStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<TaxObligationStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetObligationStatus(id, status, out var obligation, out var error))
            return BadRequest(new { error });
        return Ok(obligation!);
    }

    // ── Returns ──────────────────────────────────────────────────────────────
    [HttpGet("returns")]
    public ActionResult<List<TaxReturn>> GetReturns([FromQuery] string? jurisdictionId, [FromQuery] string? status, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetTaxReturns(jurisdictionId, status, companyId));
    }

    [HttpPost("returns")]
    public ActionResult<TaxReturn> CreateReturn([FromBody] TaxReturn request)
    {
        if (!_store.CreateTaxReturn(request, out var ret, out var error))
            return BadRequest(new { error });
        return Created("", ret!);
    }

    [HttpPost("returns/{id}/file")]
    public ActionResult<TaxReturn> FileReturn(Guid id)
    {
        if (!_store.FileTaxReturn(id, out var ret, out var error))
            return BadRequest(new { error });
        return Ok(ret!);
    }

    // ── Withholding Certificates ─────────────────────────────────────────────
    [HttpGet("withholding")]
    public ActionResult<List<WithholdingCertificate>> GetWithholding([FromQuery] string? type, [FromQuery] string? status, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetWithholdingCertificates(type, status, companyId));
    }

    [HttpPost("withholding")]
    public ActionResult<WithholdingCertificate> CreateWithholding([FromBody] WithholdingCertificateRequest request)
    {
        if (!_store.CreateWithholdingCertificate(request, out var cert, out var error))
            return BadRequest(new { error });
        return Created("", cert!);
    }

    // ── E-Invoices ───────────────────────────────────────────────────────────
    [HttpGet("e-invoices")]
    public ActionResult<List<EInvoice>> GetEInvoices([FromQuery] string? type, [FromQuery] EInvoiceStatus? status, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetEInvoices(type, status, companyId));
    }

    [HttpPost("e-invoices")]
    public ActionResult<EInvoice> CreateEInvoice([FromBody] EInvoiceRequest request)
    {
        if (!_store.CreateEInvoice(request, out var invoice, out var error))
            return BadRequest(new { error });
        return Created("", invoice!);
    }

    [HttpPost("e-invoices/{id}/status")]
    public ActionResult<EInvoice> SetEInvoiceStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!Enum.TryParse<EInvoiceStatus>(request.Status, true, out var status))
            return BadRequest(new { error = "Invalid status" });
        if (!_store.SetEInvoiceStatus(id, status, out var invoice, out var error))
            return BadRequest(new { error });
        return Ok(invoice!);
    }
}