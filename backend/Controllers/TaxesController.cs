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

    [HttpGet("authorities")]
    public ActionResult<IEnumerable<TaxAuthority>> GetAuthorities()
    {
        return Ok(_store.TaxAuthorities);
    }

    [HttpGet("codes")]
    public ActionResult<IEnumerable<TaxCode>> GetCodes()
    {
        return Ok(_store.TaxCodes);
    }

    [HttpGet("rates")]
    public ActionResult<IEnumerable<TaxRate>> GetRates()
    {
        return Ok(_store.TaxRates);
    }

    [HttpPost("codes")]
    public IActionResult CreateCode(TaxCodeRequest request)
    {
        if (!_store.CreateTaxCode(request, out var code, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/taxes/codes/{code!.Id}", code);
    }

    [HttpPut("codes/{id:guid}")]
    public IActionResult UpdateCode(Guid id, TaxCodeRequest request)
    {
        if (!_store.UpdateTaxCode(id, request, out var code, out var error))
            return BadRequest(new { Error = error });
        return Ok(code);
    }

    [HttpPost("rates")]
    public IActionResult CreateRate([FromBody] AddTaxRateRequest request)
    {
        if (!_store.AddTaxRate(request.TaxCodeId, request.Percentage, request.EffectiveFrom, request.EffectiveTo, out var rate, out var error))
            return BadRequest(new { Error = error });
        return Created("/api/v1/taxes/rates", rate);
    }

    [HttpGet("jurisdictions")]
    public IActionResult Jurisdictions()
    {
        return Ok(JurisdictionData.Reference);
    }
}

public record AddTaxRateRequest(Guid TaxCodeId, decimal Percentage, DateOnly EffectiveFrom, DateOnly? EffectiveTo = null);

public static class JurisdictionData
{
    public static readonly object[] Reference =
    [
        new { id = "UK", name = "United Kingdom", flag = "🇬🇧", authority = "HMRC", currency = "GBP", regime = "VAT", standardRate = 20m, reducedRate = 5m, zeroRate = 0m, registrationThreshold = 90000m, filingFrequency = "Quarterly", filingForm = "VAT Return (Form 100)", corporateTax = "25% (19% small profits)", note = "VAT registered above £90k annual taxable turnover; Making Tax Digital for VAT applies." },
        new { id = "USA", name = "United States of America", flag = "🇺🇸", authority = "IRS / State Depts", currency = "USD", regime = "Sales & Use Tax", standardRate = 0m, reducedRate = 0m, zeroRate = 0m, registrationThreshold = 0m, filingFrequency = "Monthly / Quarterly", filingForm = "Form ST-9 / 941 / 1120", corporateTax = "21% federal + state", note = "No federal VAT; sales tax varies by state (0–12%). Federal corporate tax 21%." },
        new { id = "PK", name = "Pakistan", flag = "🇵🇰", authority = "FBR / Provincial RA", currency = "PKR", regime = "Sales Tax (GST)", standardRate = 18m, reducedRate = 5m, zeroRate = 0m, registrationThreshold = 0m, filingFrequency = "Monthly", filingForm = "Sales Tax Return", corporateTax = "29%", note = "Federal sales tax 18% (FBR); Punjab sales tax on services 16% (PRA). WHT rules per FBR SRO." },
        new { id = "EU", name = "European Union", flag = "🇪🇺", authority = "Member-State VAT Offices", currency = "EUR", regime = "EU VAT", standardRate = 21m, reducedRate = 5m, zeroRate = 0m, registrationThreshold = 0m, filingFrequency = "Quarterly / Monthly", filingForm = "EC Sales List + VAT Return", corporateTax = "~9–30% per member state", note = "EU VAT directive; standard rate ≥15%, typical 19–27%. One-Stop-Shop (OSS) for cross-border B2C." },
        new { id = "UAE", name = "United Arab Emirates", flag = "🇦🇪", authority = "FTA", currency = "AED", regime = "VAT", standardRate = 5m, reducedRate = 0m, zeroRate = 0m, registrationThreshold = 375000m, filingFrequency = "Quarterly", filingForm = "VAT Return (VAT201)", corporateTax = "9% (above AED 375k profit)", note = "VAT 5% via FTA; registration threshold AED 375,000. Corporate tax 9% effective 2023." },
        new { id = "SA", name = "Saudi Arabia", flag = "🇸🇦", authority = "ZATCA", currency = "SAR", regime = "VAT", standardRate = 15m, reducedRate = 0m, zeroRate = 0m, registrationThreshold = 375000m, filingFrequency = "Monthly / Quarterly", filingForm = "VAT Return (via ZATCA)", corporateTax = "20%", note = "VAT raised to 15% (2020). E-invoicing (Fatoora) mandatory via ZATCA." },
        new { id = "CA", name = "Canada", flag = "🇨🇦", authority = "CRA", currency = "CAD", regime = "GST / HST / PST", standardRate = 5m, reducedRate = 5m, zeroRate = 0m, registrationThreshold = 30000m, filingFrequency = "Quarterly / Annual", filingForm = "GST/HST Return (GST34)", corporateTax = "15% federal + provincial", note = "GST 5% federal; HST 13% in ON/NS/NB/PEI/NL; PST/QST provinces. GST registered above $30k." }
    ];
}