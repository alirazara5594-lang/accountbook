using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/sales-orders")]
public class SalesOrdersController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult Get([FromQuery] Guid? companyId)
    {
        var list = store.SalesOrders;
        if (companyId.HasValue)
        {
            list = [.. list.Where(o => o.CompanyId == companyId.Value)];
        }
        return Ok(list.OrderByDescending(o => o.OrderDate).ThenByDescending(o => o.OrderNumber));
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetOne(Guid id)
    {
        var order = store.SalesOrders.FirstOrDefault(o => o.Id == id);
        return order is not null ? Ok(order) : NotFound();
    }

    [HttpPost]
    public IActionResult Create([FromBody] SalesOrderRequest request)
    {
        if (request.Lines == null || request.Lines.Count == 0)
        {
            return BadRequest(new { error = "Sales Order must have at least one line." });
        }

        if (store.CreateSalesOrder(request, out var order, out var error))
        {
            return CreatedAtAction(nameof(GetOne), new { id = order.Id }, order);
        }

        return BadRequest(new { error });
    }

    [HttpPatch("{id:guid}/status")]
    public IActionResult UpdateStatus(Guid id, [FromBody] SalesOrderStatusRequest request)
    {
        if (store.UpdateSalesOrderStatus(id, request.Status, out var error))
        {
            return Ok(new { message = $"Sales Order status updated to {request.Status}." });
        }
        return BadRequest(new { error });
    }

    [HttpPost("{id:guid}/convert-to-invoice")]
    public IActionResult ConvertToInvoice(Guid id)
    {
        if (store.ConvertSalesOrderToInvoice(id, out var invoice, out var error))
        {
            return Ok(new { message = "Sales Order successfully converted to draft invoice.", invoiceId = invoice!.Id, invoiceNumber = invoice.InvoiceNumber });
        }
        return BadRequest(new { error });
    }
}
