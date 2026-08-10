using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers
{
    [ApiController]
    [Route("api/v1/procurement")]
    public class ProcurementController : ControllerBase
    {
        private readonly AccountingStore _store;

        public ProcurementController(AccountingStore store)
        {
            _store = store;
        }

        // ─── 1. Purchase Requests (PR) ──────────────────────────────────────────────
        [HttpGet("requests")]
        public IActionResult GetRequests([FromQuery] string? companyId)
        {
            var prs = _store.PurchaseRequests;
            if (!string.IsNullOrWhiteSpace(companyId) && Guid.TryParse(companyId, out var cId))
            {
                prs = prs.Where(p => p.CompanyId == Guid.Empty || p.CompanyId == cId).ToList();
            }
            return Ok(prs);
        }

        [HttpPost("requests")]
        public IActionResult CreateRequest([FromBody] PurchaseRequest request)
        {
            if (request.Lines == null || request.Lines.Count == 0)
                return BadRequest(new { error = "Purchase Request requires at least one line item." });

            var created = _store.CreatePurchaseRequest(request);
            return Ok(created);
        }

        // ─── 2. RFQs & Vendor Quotes ────────────────────────────────────────────────
        [HttpGet("rfqs")]
        public IActionResult GetRfqs([FromQuery] string? companyId)
        {
            var rfqs = _store.RequestForQuotations;
            if (!string.IsNullOrWhiteSpace(companyId) && Guid.TryParse(companyId, out var cId))
            {
                rfqs = rfqs.Where(r => r.CompanyId == Guid.Empty || r.CompanyId == cId).ToList();
            }
            return Ok(rfqs);
        }

        [HttpPost("rfqs")]
        public IActionResult CreateRfq([FromBody] RequestForQuotation rfq)
        {
            var created = _store.CreateRfq(rfq);
            return Ok(created);
        }

        [HttpGet("vendor-quotes")]
        public IActionResult GetVendorQuotes([FromQuery] string? rfqId, [FromQuery] string? companyId)
        {
            var quotes = _store.VendorQuotes;
            if (!string.IsNullOrWhiteSpace(rfqId) && Guid.TryParse(rfqId, out var rId)) quotes = quotes.Where(q => q.RequestForQuotationId == rId).ToList();
            if (!string.IsNullOrWhiteSpace(companyId) && Guid.TryParse(companyId, out var cId)) quotes = quotes.Where(q => q.CompanyId == Guid.Empty || q.CompanyId == cId).ToList();
            return Ok(quotes);
        }

        [HttpPost("vendor-quotes")]
        public IActionResult SubmitVendorQuote([FromBody] VendorQuote quote)
        {
            var created = _store.CreateVendorQuote(quote);
            return Ok(created);
        }

        [HttpPost("vendor-quotes/{id}/select")]
        public IActionResult SelectVendorQuote(string id)
        {
            if (!_store.SelectVendorQuote(id, out var error))
                return BadRequest(new { error });

            return Ok(new { message = "Vendor quote awarded and selected for Purchase Order." });
        }

        // ─── 3. Purchase Orders (PO) ────────────────────────────────────────────────
        [HttpGet("orders")]
        public IActionResult GetPurchaseOrders([FromQuery] string? companyId)
        {
            var pos = _store.PurchaseOrders;
            if (!string.IsNullOrWhiteSpace(companyId) && Guid.TryParse(companyId, out var cId))
            {
                pos = pos.Where(p => p.CompanyId == null || p.CompanyId == cId).ToList();
            }
            return Ok(pos);
        }

        [HttpPost("orders")]
        public IActionResult CreatePurchaseOrder([FromBody] PurchaseOrder po)
        {
            return Ok(po);
        }

        // ─── 4. Goods Receipt Notes (GRN) & Destination Routing ─────────────────────
        [HttpGet("grn")]
        public IActionResult GetGrns([FromQuery] string? companyId)
        {
            var grns = _store.GoodsReceiptNoteLogs;
            if (!string.IsNullOrWhiteSpace(companyId)) grns = grns.Where(g => string.IsNullOrEmpty(g.CompanyId) || g.CompanyId == companyId).ToList();
            return Ok(grns);
        }

        [HttpPost("grn")]
        public IActionResult ReceiveGrn([FromBody] GoodsReceiptNoteModel grn)
        {
            if (!_store.ProcessGrnReceiving(grn, out var error))
                return BadRequest(new { error });

            return Ok(new { message = "GRN processed successfully. Destination routing completed (Inventory, Assets, Expense, Mfg)." });
        }

        // ─── 5. Vendor Bills / Invoices ─────────────────────────────────────────────
        [HttpGet("bills")]
        public IActionResult GetVendorBills([FromQuery] string? companyId)
        {
            var bills = _store.VendorBills;
            if (!string.IsNullOrWhiteSpace(companyId) && Guid.TryParse(companyId, out var cId))
            {
                bills = bills.Where(b => b.CompanyId == Guid.Empty || b.CompanyId == cId).ToList();
            }
            return Ok(bills);
        }

        [HttpPost("bills")]
        public IActionResult CreateVendorBill([FromBody] VendorBill bill)
        {
            var created = _store.CreateVendorBill(bill);
            return Ok(created);
        }

        [HttpPut("bills/{id}")]
        public IActionResult UpdateVendorBill(Guid id, [FromBody] VendorBill updated)
        {
            if (_store.UpdateVendorBill(id, updated, out var error))
            {
                return Ok(new { message = "Vendor Bill updated." });
            }
            return BadRequest(new { error });
        }

        [HttpPost("bills/{id}/post")]
        public IActionResult PostVendorBill(Guid id)
        {
            if (_store.PostVendorBill(id, out var error))
            {
                return Ok(new { message = "Vendor Bill posted to Accounts Payable." });
            }
            return BadRequest(new { error });
        }

        [HttpPost("orders/{id}/issue")]
        public IActionResult IssuePurchaseOrder(Guid id)
        {
            if (_store.UpdatePurchaseOrderStatus(id, PurchaseOrderStatus.Issued, out var error))
            {
                return Ok(new { message = "Purchase Order issued." });
            }
            return BadRequest(new { error });
        }

        // ─── 6. 3-Way Matching Engine ───────────────────────────────────────────────
        [HttpGet("three-way-match/{poId}")]
        public IActionResult ValidateThreeWayMatch(string poId)
        {
            var match = _store.ValidateThreeWayMatch(poId);
            return Ok(match);
        }

        // ─── 6. Stock Transfers ──────────────────────────────────────────────────────
        [HttpGet("transfers")]
        public IActionResult GetStockTransfers([FromQuery] string? companyId)
        {
            var transfers = _store.StockTransfers;
            if (!string.IsNullOrWhiteSpace(companyId)) transfers = transfers.Where(t => string.IsNullOrEmpty(t.CompanyId) || t.CompanyId == companyId).ToList();
            return Ok(transfers);
        }

        [HttpPost("transfers")]
        public IActionResult CreateStockTransfer([FromBody] StockTransfer transfer)
        {
            if (!_store.ProcessStockTransfer(transfer, out var error))
                return BadRequest(new { error });

            return Ok(new { message = "Stock transfer completed between warehouses." });
        }
    }
}
