using Zenabook.Api.Services;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Zenabook.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Disable reloadOnChange FileSystemWatcher to prevent inotify limit (128) crash on Linux container environments
builder.Configuration.Sources.Clear();
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
                     .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: false)
                     .AddEnvironmentVariables();

builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
var postgresConnection = builder.Configuration.GetConnectionString("Postgres");
if (!string.IsNullOrWhiteSpace(postgresConnection))
    builder.Services.AddDbContextFactory<AccountingDbContext>(options => options.UseNpgsql(postgresConnection));
builder.Services.AddSingleton<AccountingStore>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Eagerly warm up AccountingStore and initialize PostgreSQL database tables on app startup
if (!string.IsNullOrWhiteSpace(postgresConnection))
{
    using var scope = app.Services.CreateScope();
    var store = scope.ServiceProvider.GetRequiredService<AccountingStore>();
}

if (app.Environment.IsDevelopment()) app.MapOpenApi();

app.UseCors();
app.UseAuthorization();
app.MapGet("/", () => Results.Ok(new
{
    name = "Accountbook Accounting API",
    status = "running",
    chartOfAccounts = "/api/v1/chart-of-accounts",
    journalEntries = "/api/v1/journal-entries",
    dashboard = "/api/v1/dashboard"
}));
app.MapControllers();
app.Run();
