using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Zenabook.Api.Models;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly AccountingStore _store;
    private readonly IConfiguration _config;

    public AuthController(AccountingStore store, IConfiguration config)
    {
        _store = store;
        _config = config;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = _store.GetAdminUsers(null, null, null)
            .FirstOrDefault(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || user.Status != UserStatus.Active)
            return Unauthorized(new { error = "Invalid credentials" });

        // In production, verify password hash. For demo, accept any password for seeded demo accounts
        var isDemo = user.Email == "admin@acme.com" || user.Email == "accountant@acme.com";
        if (!isDemo && !VerifyPassword(user, request.Password))
            return Unauthorized(new { error = "Invalid credentials" });

        var token = GenerateJwtToken(user);
        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.UserName,
                user.FullName,
                user.Email,
                user.Role,
                user.CompanyId
            }
        });
    }

    [HttpPost("validate")]
    public IActionResult ValidateToken()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { error = "Invalid token" });

        return Ok(new { valid = true, userId });
    }

    private string GenerateJwtToken(AdminUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "DEFAULt-Jwt-S3cr3t-K3y-F0r-Dev-0nly!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("companyId", user.CompanyId?.ToString() ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "ZenabookERP",
            audience: _config["Jwt:Audience"] ?? "ZenabookERP.Client",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private bool VerifyPassword(AdminUser user, string password)
    {
        // Placeholder - in production check password hash
        return true;
    }
}

public record LoginRequest(string Email, string Password);