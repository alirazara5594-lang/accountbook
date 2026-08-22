using Microsoft.AspNetCore.Mvc;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/bank-accounts")]
public class BankAccountsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetBankAccounts([FromQuery] Guid? companyId)
    {
        return Ok(store.GetCashBankAccounts(bankOnly: true, companyId));
    }

    [HttpPost]
    public IActionResult CreateBankAccount([FromBody] CashBankAccountRequest request)
    {
        if (!store.CreateCashBankAccount(request, bankOnly: true, out var account, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/bank-accounts/{account!.Id}", account);
    }

    [HttpPut("{id:guid}")]
    public IActionResult UpdateBankAccount(Guid id, [FromBody] CashBankAccountRequest request)
    {
        if (!store.UpdateCashBankAccount(id, request, bankOnly: true, out var account, out var error))
            return BadRequest(new { Error = error });
        return Ok(account);
    }
}

[ApiController]
[Route("api/v1/cash-accounts")]
public class CashAccountsController(AccountingStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetCashAccounts([FromQuery] Guid? companyId)
    {
        return Ok(store.GetCashBankAccounts(bankOnly: false, companyId));
    }

    [HttpPost]
    public IActionResult CreateCashAccount([FromBody] CashBankAccountRequest request)
    {
        if (!store.CreateCashBankAccount(request, bankOnly: false, out var account, out var error))
            return BadRequest(new { Error = error });
        return Created($"/api/v1/cash-accounts/{account!.Id}", account);
    }

    [HttpPut("{id:guid}")]
    public IActionResult UpdateCashAccount(Guid id, [FromBody] CashBankAccountRequest request)
    {
        if (!store.UpdateCashBankAccount(id, request, bankOnly: false, out var account, out var error))
            return BadRequest(new { Error = error });
        return Ok(account);
    }
}