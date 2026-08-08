using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/customers")]
public class CustomersController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult Get([FromQuery] string? search, [FromQuery] CustomerStatus? status, [FromQuery] Guid? companyId)
    {
        var result = store.Customers.Where(c =>
            (status is null || c.Status == status) &&
            (companyId is null || c.CompanyId == null || c.CompanyId == companyId) &&
            (string.IsNullOrWhiteSpace(search) ||
             c.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
             c.CustomerNumber.Contains(search, StringComparison.OrdinalIgnoreCase) ||
             (c.Email != null && c.Email.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
             (c.Phone != null && c.Phone.Contains(search, StringComparison.OrdinalIgnoreCase)))
        ).OrderBy(c => c.CustomerNumber);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetOne(Guid id) => store.FindCustomer(id) is { } c ? Ok(c) : NotFound();

    [HttpGet("next-number")]
    public IActionResult NextNumber() => Ok(new { customerNumber = store.NextCustomerNumber() });

    [HttpPost]
    public IActionResult Create(CustomerRequest request)
    {
        if (store.CreateCustomer(request, out var customer, out var error))
        {
            return CreatedAtAction(nameof(GetOne), new { id = customer!.Id }, customer);
        }
        return BadRequest(new { message = error });
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, CustomerRequest request)
    {
        if (store.UpdateCustomer(id, request, out var customer, out var error))
        {
            return Ok(customer);
        }
        return BadRequest(new { message = error });
    }

    [HttpPatch("{id:guid}/status")]
    public IActionResult SetStatus(Guid id, CustomerStatusRequest request)
    {
        if (store.SetCustomerStatus(id, request.Status, out var error))
        {
            return Ok(store.FindCustomer(id));
        }
        return BadRequest(new { message = error });
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        if (store.DeleteCustomer(id, out var error))
        {
            return NoContent();
        }
        return BadRequest(new { message = error });
    }
}
