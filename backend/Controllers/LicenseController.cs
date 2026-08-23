using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Zenabook.Api.Services;

namespace Zenabook.Api.Controllers;

[ApiController]
[Route("api/v1/license")]
public class LicenseController : ControllerBase
{
    private readonly AccountingStore _store;
    private const string SecretKey = "AMS-ERP-Master-License-Signing-Key-2026";

    // In-memory / persistent license state
    private static DateTime _installDate = DateTime.UtcNow;
    private static int _trialDays = 90;
    private static LicenseData? _activeLicense = null;
    private static readonly List<CustomerFeedback> _feedbacks = new();

    public LicenseController(AccountingStore store)
    {
        _store = store;
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        var now = DateTime.UtcNow;
        if (_activeLicense != null)
        {
            var isExpired = _activeLicense.ExpiryDate.HasValue && _activeLicense.ExpiryDate.Value < now;
            return Ok(new
            {
                status = isExpired ? "Expired" : "Active",
                tier = _activeLicense.Tier,
                licensedTo = _activeLicense.OrganizationName,
                licenseKey = _activeLicense.LicenseKey,
                issuedAt = _activeLicense.IssuedAt,
                expiryDate = _activeLicense.ExpiryDate,
                daysRemaining = _activeLicense.ExpiryDate.HasValue ? Math.Max(0, (int)(_activeLicense.ExpiryDate.Value - now).TotalDays) : 9999,
                isTrial = false
            });
        }

        // Trial calculation
        var trialEnd = _installDate.AddDays(_trialDays);
        var remaining = Math.Max(0, (int)(trialEnd - now).TotalDays);
        var trialExpired = remaining <= 0;

        return Ok(new
        {
            status = trialExpired ? "TrialExpired" : "Trial",
            tier = "90-Day Commercial Evaluation",
            licensedTo = "Pilot Organization",
            licenseKey = (string?)null,
            issuedAt = _installDate,
            expiryDate = (DateTime?)trialEnd,
            daysRemaining = remaining,
            isTrial = true
        });
    }

    [HttpPost("activate")]
    public IActionResult ActivateLicense([FromBody] ActivateLicenseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.LicenseKey))
            return BadRequest(new { error = "License key cannot be empty." });

        var (isValid, payload, error) = VerifyLicenseKey(request.LicenseKey.Trim());
        if (!isValid || payload == null)
            return BadRequest(new { error = error ?? "Invalid or tampered license key." });

        if (payload.ExpiryDate.HasValue && payload.ExpiryDate.Value < DateTime.UtcNow)
            return BadRequest(new { error = "This license key has already expired." });

        _activeLicense = new LicenseData
        {
            LicenseKey = request.LicenseKey.Trim(),
            OrganizationName = payload.OrganizationName,
            Tier = payload.Tier,
            IssuedAt = payload.IssuedAt,
            ExpiryDate = payload.ExpiryDate
        };

        return Ok(new
        {
            message = $"Successfully activated {_activeLicense.Tier} license for {_activeLicense.OrganizationName}!",
            license = _activeLicense
        });
    }

    [HttpPost("generate")]
    public IActionResult GenerateLicense([FromBody] GenerateLicenseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.OrganizationName))
            return BadRequest(new { error = "Organization name is required." });

        var issuedAt = DateTime.UtcNow;
        DateTime? expiry = request.DurationMonths switch
        {
            3 => issuedAt.AddMonths(3),
            6 => issuedAt.AddMonths(6),
            12 => issuedAt.AddYears(1),
            24 => issuedAt.AddYears(2),
            _ => null // Lifetime
        };

        var payload = new LicensePayload(
            request.OrganizationName.Trim(),
            request.Tier ?? "Founding Partner / Beta Enterprise",
            issuedAt,
            expiry,
            request.MaxUsers ?? 100
        );

        var key = SignLicensePayload(payload);

        return Ok(new
        {
            licenseKey = key,
            organizationName = payload.OrganizationName,
            tier = payload.Tier,
            issuedAt = payload.IssuedAt,
            expiryDate = payload.ExpiryDate,
            duration = request.DurationMonths > 0 ? $"{request.DurationMonths} Months" : "Lifetime"
        });
    }

    [HttpPost("feedback")]
    public IActionResult SubmitFeedback([FromBody] CustomerFeedback feedback)
    {
        if (string.IsNullOrWhiteSpace(feedback.FeedbackText))
            return BadRequest(new { error = "Feedback text is required." });

        feedback.Id = Guid.NewGuid();
        feedback.SubmittedAt = DateTime.UtcNow;
        _feedbacks.Add(feedback);

        return Ok(new { message = "Thank you! Your feedback has been received.", feedbackId = feedback.Id });
    }

    [HttpGet("feedback")]
    public IActionResult GetFeedback()
    {
        return Ok(_feedbacks.OrderByDescending(f => f.SubmittedAt).ToList());
    }

    private static string SignLicensePayload(LicensePayload payload)
    {
        var json = JsonSerializer.Serialize(payload);
        var jsonBytes = Encoding.UTF8.GetBytes(json);
        var base64Payload = Convert.ToBase64String(jsonBytes);

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SecretKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(base64Payload));
        var signature = Convert.ToBase64String(hash);

        return $"AMS-{base64Payload}.{signature}";
    }

    private static (bool IsValid, LicensePayload? Payload, string? Error) VerifyLicenseKey(string key)
    {
        if (!key.StartsWith("AMS-") || !key.Contains('.'))
            return (false, null, "Malformed license key format.");

        try
        {
            var raw = key["AMS-".Length..];
            var parts = raw.Split('.');
            if (parts.Length != 2) return (false, null, "Invalid key structure.");

            var base64Payload = parts[0];
            var signature = parts[1];

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SecretKey));
            var computedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(base64Payload)));

            if (computedHash != signature)
                return (false, null, "Signature mismatch. Key is invalid or tampered.");

            var jsonBytes = Convert.FromBase64String(base64Payload);
            var json = Encoding.UTF8.GetString(jsonBytes);
            var payload = JsonSerializer.Deserialize<LicensePayload>(json);

            return (true, payload, null);
        }
        catch (Exception ex)
        {
            return (false, null, $"Verification error: {ex.Message}");
        }
    }
}

public record LicensePayload(
    string OrganizationName,
    string Tier,
    DateTime IssuedAt,
    DateTime? ExpiryDate,
    int MaxUsers
);

public record LicenseData
{
    public string LicenseKey { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public record ActivateLicenseRequest(string LicenseKey);

public record GenerateLicenseRequest(
    string OrganizationName,
    string? Tier,
    int DurationMonths,
    int? MaxUsers
);

public class CustomerFeedback
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string Category { get; set; } = "Feature Request"; // Feature Request, Bug Report, Accounting Suggestion, Praise
    public int Rating { get; set; } = 5; // 1 to 5 stars
    public string FeedbackText { get; set; } = string.Empty;
    public string CurrentScreen { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}
