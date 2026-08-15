using Zenabook.Api.Services;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Zenabook.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Disable reloadOnChange FileSystemWatcher to prevent inotify limit (128) crash on Linux container environments
builder.Configuration.Sources.Clear();
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
                     .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: false)
                     .AddEnvironmentVariables();

builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

// Evaluate connection string from environment variables first, falling back to configuration
var rawConnection = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
    ?? builder.Configuration.GetConnectionString("Postgres");

var postgresConnection = NormalizePostgresConnectionString(rawConnection);

if (!string.IsNullOrWhiteSpace(postgresConnection))
    builder.Services.AddDbContextFactory<AccountingDbContext>(options => options.UseNpgsql(postgresConnection));

builder.Services.AddSingleton<AccountingStore>(sp =>
{
    var dbFactory = sp.GetService<IDbContextFactory<AccountingDbContext>>();
    var config = sp.GetRequiredService<IConfiguration>();
    return new AccountingStore(dbFactory, config);
});

// JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ZenabookERP",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ZenabookERP.Client",
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "DEFAULt-Jwt-S3cr3t-K3y-F0r-Dev-0nly!"))
    };
});

builder.Services.AddAuthorization();

// Environment-aware CORS configuration
var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (!string.IsNullOrWhiteSpace(allowedOrigins))
        {
            var origins = allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        }
        else
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// Eagerly warm up AccountingStore and initialize PostgreSQL database tables on app startup
if (!string.IsNullOrWhiteSpace(postgresConnection))
{
    using var scope = app.Services.CreateScope();
    var store = scope.ServiceProvider.GetRequiredService<AccountingStore>();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", (IConfiguration cfg) => Results.Ok(new
{
    name = "Accountbook Accounting API",
    environment = app.Environment.EnvironmentName,
    status = "running",
    activeCountry = cfg["ERP:ActiveCountry"] ?? "PK",
    databaseConnected = !string.IsNullOrWhiteSpace(postgresConnection),
    chartOfAccounts = "/api/v1/chart-of-accounts",
    journalEntries = "/api/v1/journal-entries",
    dashboard = "/api/v1/dashboard"
}));

app.MapControllers();
app.Run();

static string? NormalizePostgresConnectionString(string? connStr)
{
    if (string.IsNullOrWhiteSpace(connStr)) return connStr;
    if (connStr.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
        connStr.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var uri = new Uri(connStr);
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var dbName = uri.AbsolutePath.TrimStart('/');
            var port = uri.Port > 0 ? uri.Port : 5432;
            return $"Host={uri.Host};Port={port};Database={dbName};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
        }
        catch
        {
            return connStr;
        }
    }
    return connStr;
}
