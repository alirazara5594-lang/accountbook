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
}
