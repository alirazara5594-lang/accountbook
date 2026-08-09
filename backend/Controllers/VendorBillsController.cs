using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/vendorbills")]
public class VendorBillsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetBills([FromQuery] Guid? companyId)
    {
        var query = store.VendorBills.AsEnumerable();
        if (companyId.HasValue) query = query.Where(a => a.CompanyId == companyId.Value);
        return Ok(query);
    }

    [HttpPost]
    public IActionResult CreateBill([FromBody] VendorBillRequest request)
    {
        if (store.CreateVendorBill(request, out var bill, out var error))
        {
            return Ok(bill);
        }
        return BadRequest(new { Error = error });
    }
}
