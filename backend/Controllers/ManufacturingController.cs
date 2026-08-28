using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers
{
    [ApiController]
    [Route("api/v1/manufacturing")]
    public class ManufacturingController : ControllerBase
    {
        private readonly AccountingStore _store;

        public ManufacturingController(AccountingStore store)
        {
            _store = store;
        }

        // ─── BOM Endpoints ──────────────────────────────────────────────────────────
        [HttpGet("bom")]
        [HttpGet("boms")]
        public IActionResult GetBoms([FromQuery] string? companyId)
        {
            var boms = _store.BillOfMaterials;
            if (!string.IsNullOrWhiteSpace(companyId))
            {
                boms = boms.Where(b => string.IsNullOrEmpty(b.CompanyId) || b.CompanyId == companyId).ToList();
            }
            return Ok(boms);
        }

        [HttpGet("bom/{id}")]
        [HttpGet("boms/{id}")]
        public IActionResult GetBomById(string id)
        {
            var bom = _store.BillOfMaterials.FirstOrDefault(b => b.Id == id);
            if (bom == null) return NotFound(new { error = "BOM not found." });
            return Ok(bom);
        }

        [HttpPost("bom")]
        [HttpPost("boms")]
        public IActionResult CreateBom([FromBody] BillOfMaterials request)
        {
            if (string.IsNullOrWhiteSpace(request.FinishedProductId))
                return BadRequest(new { error = "Finished product is required for a BOM." });
            if (request.Lines == null || request.Lines.Count == 0)
                return BadRequest(new { error = "At least one raw material line is required." });

            var created = _store.CreateBom(request);
            return Ok(created);
        }

        [HttpPut("bom/{id}")]
        [HttpPut("boms/{id}")]
        public IActionResult UpdateBom(string id, [FromBody] BillOfMaterials request)
        {
            if (!_store.UpdateBom(id, request, out var error))
            {
                return BadRequest(new { error });
            }
            return Ok(new { message = "BOM recipe updated successfully." });
        }

        [HttpDelete("bom/{id}")]
        [HttpDelete("boms/{id}")]
        public IActionResult DeleteBom(string id)
        {
            if (!_store.DeleteBom(id, out var error))
            {
                return BadRequest(new { error });
            }
            return Ok(new { message = "BOM recipe deleted." });
        }

        // ─── Work Order Endpoints ───────────────────────────────────────────────────
        [HttpGet("work-orders")]
        public IActionResult GetWorkOrders([FromQuery] string? companyId)
        {
            var orders = _store.WorkOrders;
            if (!string.IsNullOrWhiteSpace(companyId))
            {
                orders = orders.Where(o => string.IsNullOrEmpty(o.CompanyId) || o.CompanyId == companyId).ToList();
            }
            return Ok(orders.OrderByDescending(o => o.CreatedAt));
        }

        [HttpGet("work-orders/{id}")]
        public IActionResult GetWorkOrder(string id)
        {
            var order = _store.WorkOrders.FirstOrDefault(o => o.Id == id);
            if (order == null) return NotFound(new { error = "Work Order not found." });
            return Ok(order);
        }

        [HttpPost("work-orders")]
        public IActionResult CreateWorkOrder([FromBody] WorkOrder request)
        {
            if (string.IsNullOrWhiteSpace(request.FinishedProductId))
                return BadRequest(new { error = "Finished product is required." });
            if (request.QuantityToProduce <= 0)
                return BadRequest(new { error = "Quantity to produce must be greater than zero." });

            var created = _store.CreateWorkOrder(request);
            return Ok(created);
        }

        [HttpPost("work-orders/{id}/cancel")]
        public IActionResult CancelWorkOrder(string id)
        {
            if (!_store.CancelWorkOrder(id, out var error))
            {
                return BadRequest(new { error });
            }
            return Ok(new { message = "Work Order cancelled." });
        }

        [HttpPost("work-orders/{id}/start")]
        public IActionResult StartWorkOrder(string id)
        {
            if (!_store.StartWorkOrder(id, out var error))
            {
                return BadRequest(new { error });
            }
            return Ok(new { message = "Work Order started. Raw Materials issued to WIP." });
        }

        public record LogMachineHoursRequest(decimal AdditionalHours, decimal? HourlyRate);

        [HttpPost("work-orders/{id}/machine-hours")]
        public IActionResult LogMachineHours(string id, [FromBody] LogMachineHoursRequest req)
        {
            if (!_store.LogMachineHours(id, req.AdditionalHours, req.HourlyRate, out var error))
            {
                return BadRequest(new { error });
            }
            return Ok(new { message = "Machine run hours and overhead absorption logged." });
        }

        [HttpPost("work-orders/{id}/qc")]
        public IActionResult PerformQcInspection(string id, [FromBody] QcInspectionRecord qc)
        {
            if (!_store.PerformQcInspection(id, qc, out var error))
            {
                return BadRequest(new { error });
            }
            return Ok(new { message = "Quality Control inspection completed.", record = qc });
        }

        public record CompleteWorkOrderRequest(decimal ActualProducedQty, decimal DirectLabor, decimal Overhead);

        [HttpPost("work-orders/{id}/complete")]
        public IActionResult CompleteWorkOrder(string id, [FromBody] CompleteWorkOrderRequest req)
        {
            if (!_store.CompleteWorkOrder(id, req.ActualProducedQty, req.DirectLabor, req.Overhead, out var error))
            {
                return BadRequest(new { error });
            }
            return Ok(new { message = "Work Order completed. Finished Goods received into inventory." });
        }
    }
}
