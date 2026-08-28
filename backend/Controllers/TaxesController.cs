using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/taxes")]
public class TaxesController : ControllerBase
{
    private readonly AccountingStore _store;

    public TaxesController(AccountingStore store)
    {
        _store = store;
    }

    // ─── Authorities ────────────────────────────────────────────────────────────
    [HttpGet("authorities")]
    public ActionResult<IEnumerable<TaxAuthority>> GetAuthorities([FromQuery] Guid? companyId)
    {
        var auths = _store.TaxAuthorities.AsEnumerable();
        if (companyId.HasValue) auths = auths.Where(a => !a.CompanyId.HasValue || a.CompanyId == companyId.Value);
        return Ok(auths);
    }

    [HttpPost("authorities")]
    public IActionResult CreateAuthority([FromBody] TaxAuthorityRequest request)
    {
        if (!_store.CreateTaxAuthority(request, out var authority, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/taxes/authorities/{authority!.Id}", authority);
    }

    [HttpPut("authorities/{id:guid}")]
    public IActionResult UpdateAuthority(Guid id, [FromBody] TaxAuthorityRequest request)
    {
        if (!_store.UpdateTaxAuthority(id, request, out var authority, out var error))
            return BadRequest(new { Error = error });
        return Ok(authority);
    }

    [HttpDelete("authorities/{id:guid}")]
    public IActionResult DeleteAuthority(Guid id)
    {
        if (!_store.DeleteTaxAuthority(id, out var error))
            return BadRequest(new { Error = error });
        return NoContent();
    }

    // ─── Codes & Rates ──────────────────────────────────────────────────────────
    [HttpGet("codes")]
    public ActionResult<IEnumerable<TaxCode>> GetCodes([FromQuery] string? jurisdictionId, [FromQuery] Guid? companyId)
    {
        var codes = _store.TaxCodes.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(jurisdictionId))
            codes = codes.Where(c => string.Equals(c.JurisdictionId, jurisdictionId, StringComparison.OrdinalIgnoreCase));
        if (companyId.HasValue)
            codes = codes.Where(c => !c.CompanyId.HasValue || c.CompanyId == companyId.Value);
        return Ok(codes);
    }

    [HttpPost("codes")]
    public IActionResult CreateCode([FromBody] TaxCodeRequest request)
    {
        if (!_store.CreateTaxCode(request, out var code, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/taxes/codes/{code!.Id}", code);
    }

    [HttpPut("codes/{id:guid}")]
    public IActionResult UpdateCode(Guid id, [FromBody] TaxCodeRequest request)
    {
        if (!_store.UpdateTaxCode(id, request, out var code, out var error))
            return BadRequest(new { Error = error });
        return Ok(code);
    }

    [HttpDelete("codes/{id:guid}")]
    public IActionResult DeleteCode(Guid id)
    {
        if (!_store.DeleteTaxCode(id, out var error))
            return BadRequest(new { Error = error });
        return NoContent();
    }

    [HttpGet("rates")]
    public ActionResult<IEnumerable<TaxRate>> GetRates([FromQuery] Guid? taxCodeId)
    {
        var rates = _store.TaxRates.AsEnumerable();
        if (taxCodeId.HasValue) rates = rates.Where(r => r.TaxCodeId == taxCodeId.Value);
        return Ok(rates);
    }

    [HttpPost("rates")]
    public IActionResult CreateRate([FromBody] AddTaxRateRequest request)
    {
        if (!_store.AddTaxRate(request.TaxCodeId, request.Percentage, request.EffectiveFrom, request.EffectiveTo, out var rate, out var error))
            return BadRequest(new { Error = error });
        return Created("/api/v1/taxes/rates", rate);
    }

    // ─── Tax Exemptions ─────────────────────────────────────────────────────────
    [HttpGet("exemptions")]
    public ActionResult<IEnumerable<TaxExemption>> GetExemptions([FromQuery] string? jurisdictionId, [FromQuery] Guid? companyId)
    {
        return Ok(_store.GetTaxExemptions(jurisdictionId, companyId));
    }

    [HttpPost("exemptions")]
    public IActionResult CreateExemption([FromBody] TaxExemptionRequest request)
    {
        if (!_store.CreateTaxExemption(request, out var exemption, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/taxes/exemptions/{exemption!.Id}", exemption);
    }

    [HttpPut("exemptions/{id:guid}")]
    public IActionResult UpdateExemption(Guid id, [FromBody] TaxExemptionRequest request)
    {
        if (!_store.UpdateTaxExemption(id, request, out var exemption, out var error))
            return BadRequest(new { Error = error });
        return Ok(exemption);
    }

    [HttpDelete("exemptions/{id:guid}")]
    public IActionResult DeleteExemption(Guid id)
    {
        if (!_store.DeleteTaxExemption(id, out var error))
            return BadRequest(new { Error = error });
        return NoContent();
    }

    // ─── Preset Auto-Provisioning ───────────────────────────────────────────────
    [HttpPost("seed-country-preset")]
    public IActionResult SeedCountryPreset([FromBody] SeedPresetRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Country))
            return BadRequest(new { Error = "Country is required." });
        if (!_store.SeedCountryTaxPreset(request.Country, request.CompanyId))
            return BadRequest(new { Error = "Failed to provision country tax preset." });
        return Ok(new { Success = true, Message = $"Country tax pack for {request.Country} provisioned successfully." });
    }

    // ─── Real-Time Box-by-Box Summary Report ───────────────────────────────────
    [HttpGet("summary-report")]
    public IActionResult GetSummaryReport([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, [FromQuery] string? jurisdictionId, [FromQuery] Guid? companyId)
    {
        var summary = _store.GetTaxSummaryReport(fromDate, toDate, jurisdictionId, companyId);
        return Ok(summary);
    }

    [HttpGet("jurisdictions")]
    public IActionResult Jurisdictions()
    {
        return Ok(JurisdictionData.Reference);
    }
}

public record SeedPresetRequest(string Country, Guid? CompanyId = null);
public record AddTaxRateRequest(Guid TaxCodeId, decimal Percentage, DateOnly EffectiveFrom, DateOnly? EffectiveTo = null);

public static class JurisdictionData
{
    public static readonly object[] Reference =
    [
        new { id = "UK", name = "United Kingdom", flag = "🇬🇧", authority = "HMRC", currency = "GBP", regime = "VAT", standardRate = 20m, reducedRate = 5m, zeroRate = 0m, registrationThreshold = 90000m, filingFrequency = "Quarterly", filingForm = "VAT Return (Form 100)", corporateTax = "25% (19% small profits)", note = "VAT registered above £90k annual taxable turnover; Making Tax Digital (MTD) for VAT applies." },
        new { id = "PK", name = "Pakistan", flag = "🇵🇰", authority = "FBR / Provincial RA", currency = "PKR", regime = "Sales Tax (GST)", standardRate = 18m, reducedRate = 5m, zeroRate = 0m, registrationThreshold = 0m, filingFrequency = "Monthly", filingForm = "Sales Tax Return (Annex C/A)", corporateTax = "29%", note = "Federal sales tax 18% (FBR); Punjab sales tax on services 16% (PRA), Sindh (SRB 13%). WHT rules Sec 153." },
        new { id = "SA", name = "Saudi Arabia", flag = "🇸🇦", authority = "ZATCA", currency = "SAR", regime = "VAT", standardRate = 15m, reducedRate = 0m, zeroRate = 0m, registrationThreshold = 375000m, filingFrequency = "Monthly / Quarterly", filingForm = "VAT Return (via ZATCA)", corporateTax = "20%", note = "Standard VAT 15%. Phase 2 E-Invoicing (Fatoora) mandatory with cryptographic stamps & QR codes." },
        new { id = "UAE", name = "United Arab Emirates", flag = "🇦🇪", authority = "FTA", currency = "AED", regime = "VAT", standardRate = 5m, reducedRate = 0m, zeroRate = 0m, registrationThreshold = 375000m, filingFrequency = "Quarterly", filingForm = "VAT Return (VAT201)", corporateTax = "9% (above AED 375k profit)", note = "VAT 5% via FTA; Designated Free Zones out of scope. Corporate tax 9% effective 2023." },
        new { id = "USA", name = "United States of America", flag = "🇺🇸", authority = "IRS / State Depts", currency = "USD", regime = "Sales & Use Tax", standardRate = 7.25m, reducedRate = 0m, zeroRate = 0m, registrationThreshold = 100000m, filingFrequency = "Monthly / Quarterly", filingForm = "Form ST-9 / 941 / 1120", corporateTax = "21% federal + state", note = "No federal VAT; sales tax varies by state/county (0–12%). Form 1099 backup withholding 24%." },
        new { id = "CA", name = "Canada", flag = "🇨🇦", authority = "CRA", currency = "CAD", regime = "GST / HST / PST", standardRate = 5m, reducedRate = 5m, zeroRate = 0m, registrationThreshold = 30000m, filingFrequency = "Quarterly / Annual", filingForm = "GST/HST Return (GST34)", corporateTax = "15% federal + provincial", note = "GST 5% federal; HST 13% in ON/NS/NB/PEI/NL; PST/QST dual-tier provincial taxes." },
        new { id = "EU", name = "European Union", flag = "🇪🇺", authority = "Member-State VAT Offices", currency = "EUR", regime = "EU VAT", standardRate = 21m, reducedRate = 5m, zeroRate = 0m, registrationThreshold = 0m, filingFrequency = "Quarterly / Monthly", filingForm = "EC Sales List + VAT Return", corporateTax = "~9–30% per member state", note = "EU VAT directive; standard rate ≥15%, typical 19–27%. One-Stop-Shop (OSS) & Reverse Charge applies." }
    ];
}