using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/vendors")]
public class VendorsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult Get([FromQuery] string? search, [FromQuery] VendorStatus? status, [FromQuery] Guid? companyId)
    {
        var result = store.Vendors.Where(v =>
            (status is null || v.Status == status) &&
            (companyId is null || v.CompanyId == null || v.CompanyId == companyId) &&
            (string.IsNullOrWhiteSpace(search) ||
             v.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
             v.VendorNumber.Contains(search, StringComparison.OrdinalIgnoreCase) ||
             (v.Email != null && v.Email.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
             (v.Phone != null && v.Phone.Contains(search, StringComparison.OrdinalIgnoreCase)))
        ).OrderBy(v => v.VendorNumber);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetOne(Guid id) => store.FindVendor(id) is { } v ? Ok(v) : NotFound();

    [HttpGet("next-number")]
    public IActionResult NextNumber() => Ok(new { vendorNumber = store.NextVendorNumber() });

    [HttpPost]
    public IActionResult Create(VendorRequest request)
    {
        if (store.CreateVendor(request, out var vendor, out var error))
        {
            return CreatedAtAction(nameof(GetOne), new { id = vendor!.Id }, vendor);
        }
        return BadRequest(new { message = error });
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, VendorRequest request)
    {
        if (store.UpdateVendor(id, request, out var vendor, out var error))
        {
            return Ok(vendor);
        }
        return BadRequest(new { message = error });
    }

    [HttpPatch("{id:guid}/status")]
    public IActionResult SetStatus(Guid id, VendorStatusRequest request)
    {
        if (store.SetVendorStatus(id, request.Status, out var error))
        {
            return Ok(store.FindVendor(id));
        }
        return BadRequest(new { message = error });
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        if (store.DeleteVendor(id, out var error))
        {
            return NoContent();
        }
        return BadRequest(new { message = error });
    }
}
