using Zenabook.Api.Models;
using Zenabook.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Zenabook.Api.Services;

public class AccountingStore
{
    private readonly List<Account> _accounts = [];
    private readonly List<JournalEntry> _entries = [];
    private readonly List<JournalTemplate> _templates = [];
    private readonly List<RecurringJournalEntry> _recurringEntries = [];
    private readonly List<JournalEvent> _journalEvents = [];
    private readonly List<IntercompanyAllocation> _intercompanyAllocations = [];
    private readonly List<Company> _companies = [];
    private readonly Dictionary<Guid, List<AuditItem>> _history = [];
    private readonly object _lock = new();

    private readonly IDbContextFactory<AccountingDbContext>? _dbFactory;
    private sealed record StoredState(List<Account> Accounts, List<JournalEntry> Entries, Dictionary<Guid, List<AuditItem>> History, List<JournalTemplate> Templates, List<RecurringJournalEntry> RecurringEntries, List<JournalEvent> Events, List<IntercompanyAllocation>? IntercompanyAllocations = null, List<Company>? Companies = null);

    public AccountingStore(IDbContextFactory<AccountingDbContext>? dbFactory = null)
    {
        _dbFactory = dbFactory;
        if (LoadState()) return;
        var parentEntity = new Company { Name = "Acme Holdings", Code = "ACME", Type = EntityType.Parent };
        _companies.AddRange([parentEntity, new Company { Name = "Acme Services", Code = "ASV", ParentId = parentEntity.Id }, new Company { Name = "Acme Trading", Code = "ATD", ParentId = parentEntity.Id }]);
        Seed("1000", "Assets", AccountType.Asset, null);
        var cash = Seed("1100", "Cash & Bank", AccountType.Asset, _accounts[0].Id, true);
        Seed("1110", "Main Bank Account", AccountType.Asset, cash.Id, true, 28450m);
        Seed("1200", "Accounts Receivable", AccountType.Asset, _accounts[0].Id, true);
        Seed("2000", "Liabilities", AccountType.Liability, null);
        Seed("2100", "Accounts Payable", AccountType.Liability, _accounts[4].Id, true);
        Seed("3000", "Equity", AccountType.Equity, null);
        Seed("4000", "Revenue", AccountType.Revenue, null);
        Seed("4100", "Sales Revenue", AccountType.Revenue, _accounts[7].Id, true);
        Seed("5000", "Expenses", AccountType.Expense, null);
        Seed("5100", "Office Expenses", AccountType.Expense, _accounts[9].Id, true);
        Persist();
    }

    private Account Seed(string code, string name, AccountType type, Guid? parent, bool reconciliation = false, decimal opening = 0)
    {
        var a = new Account { Code = code, Name = name, Type = type, ParentId = parent, ReconciliationEnabled = reconciliation, OpeningBalance = opening, OpeningBalanceDate = opening != 0 ? DateOnly.FromDateTime(DateTime.Today) : null };
        _accounts.Add(a); _history[a.Id] = [new(DateTime.UtcNow, "Created", "Starter account")]; return a;
    }
    public IReadOnlyList<Account> Accounts => _accounts;
    public IReadOnlyList<JournalEntry> Entries => _entries;
    public IReadOnlyList<JournalTemplate> Templates => _templates;
    public IReadOnlyList<RecurringJournalEntry> RecurringEntries => _recurringEntries;
    public IReadOnlyList<IntercompanyAllocation> IntercompanyAllocations => _intercompanyAllocations;
    public IReadOnlyList<Company> Companies => _companies;
    public bool CreateCompany(CompanyRequest request, out Company? company, out string? error)
    {
        company = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Country) || string.IsNullOrWhiteSpace(request.CurrencyCode)) { error = "Entity name, country, and currency are required."; return false; }
        if (_companies.Any(x => x.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase))) { error = "A company with this name already exists."; return false; }
        if (!string.IsNullOrWhiteSpace(request.Code) && _companies.Any(x => x.Code?.Equals(request.Code.Trim(), StringComparison.OrdinalIgnoreCase) == true)) { error = "An entity with this code already exists."; return false; }
        if (request.ParentId is { } parentId && !_companies.Any(x => x.Id == parentId && x.Active)) { error = "Select an active parent entity."; return false; }
        company = new Company { Name = request.Name.Trim(), Code = request.Code?.Trim(), LegalName = request.LegalName?.Trim(), Type = request.Type, ParentId = request.ParentId, Country = request.Country.Trim(), CurrencyCode = request.CurrencyCode.Trim().ToUpperInvariant() }; _companies.Add(company); Persist(); return true;
    }
    public bool UpdateCompany(Guid id, CompanyRequest request, out Company? company, out string? error)
    {
        company = _companies.FirstOrDefault(x => x.Id == id); error = null;
        if (company is null) { error = "Entity not found."; return false; }
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Country) || string.IsNullOrWhiteSpace(request.CurrencyCode)) { error = "Entity name, country, and currency are required."; return false; }
        if (_companies.Any(x => x.Id != id && x.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase))) { error = "A company with this name already exists."; return false; }
        if (!string.IsNullOrWhiteSpace(request.Code) && _companies.Any(x => x.Id != id && x.Code?.Equals(request.Code.Trim(), StringComparison.OrdinalIgnoreCase) == true)) { error = "An entity with this code already exists."; return false; }
        if (request.ParentId == id || (request.ParentId is { } parentId && (!IsValidParent(id, parentId) || !_companies.Any(x => x.Id == parentId && x.Active)))) { error = "An entity cannot be its own parent or a descendant of itself."; return false; }
        company.Name = request.Name.Trim(); company.Code = request.Code?.Trim(); company.LegalName = request.LegalName?.Trim(); company.Type = request.Type; company.ParentId = request.ParentId; company.Country = request.Country.Trim(); company.CurrencyCode = request.CurrencyCode.Trim().ToUpperInvariant(); company.UpdatedAt = DateTime.UtcNow; Persist(); return true;
    }
    public bool SetCompanyStatus(Guid id, bool active, out string? error)
    {
        var company = _companies.FirstOrDefault(x => x.Id == id); error = null;
        if (company is null) { error = "Entity not found."; return false; }
        if (!active && _companies.Any(x => x.ParentId == id && x.Active)) { error = "Deactivate or move active child entities first."; return false; }
        company.Active = active; company.UpdatedAt = DateTime.UtcNow; Persist(); return true;
    }
    private bool IsValidParent(Guid entityId, Guid parentId)
    {
        var current = _companies.FirstOrDefault(x => x.Id == parentId);
        while (current is not null) { if (current.Id == entityId) return false; current = current.ParentId is { } next ? _companies.FirstOrDefault(x => x.Id == next) : null; }
        return true;
    }
    public Account? Find(Guid id) => _accounts.FirstOrDefault(x => x.Id == id);
    public IEnumerable<AuditItem> History(Guid id) => _history.GetValueOrDefault(id, []);
    public string NextCode(AccountType type)
    {
        var prefix = type switch { AccountType.Asset or AccountType.ContraAsset => 1, AccountType.Liability or AccountType.ContraLiability => 2, AccountType.Equity or AccountType.ContraEquity => 3, AccountType.Revenue or AccountType.ContraRevenue => 4, _ => 5 };
        var highest = _accounts.Where(x => x.Code.StartsWith(prefix.ToString())).Select(x => int.TryParse(x.Code, out var n) ? n : prefix * 1000).DefaultIfEmpty(prefix * 1000).Max();
        return (highest + 10).ToString();
    }
    public Account Create(AccountRequest r)
    {
        lock (_lock)
        {
            Validate(r, null);
            var account = new Account { Code = string.IsNullOrWhiteSpace(r.Code) ? NextCode(r.Type) : r.Code.Trim(), Name = r.Name.Trim(), Type = r.Type, ParentId = r.ParentId, OpeningBalance = r.OpeningBalance, OpeningBalanceDate = r.OpeningBalanceDate, ReconciliationEnabled = r.ReconciliationEnabled, IfrsTag = r.IfrsTag, GaapTag = r.GaapTag, CustomFields = r.CustomFields ?? [] };
            _accounts.Add(account); _history[account.Id] = [new(DateTime.UtcNow, "Created", "Account created")]; return account;
        }
    }
    public bool Update(Guid id, AccountRequest r, out string? error)
    {
        lock (_lock)
        {
            var a = Find(id); if (a is null) { error = "Account not found."; return false; }
            try { Validate(r, id); } catch (Exception e) { error = e.Message; return false; }
            a.Code = string.IsNullOrWhiteSpace(r.Code) ? a.Code : r.Code.Trim(); a.Name = r.Name.Trim(); a.Type = r.Type; a.ParentId = r.ParentId; a.OpeningBalance = r.OpeningBalance; a.OpeningBalanceDate = r.OpeningBalanceDate; a.ReconciliationEnabled = r.ReconciliationEnabled; a.IfrsTag = r.IfrsTag; a.GaapTag = r.GaapTag; a.CustomFields = r.CustomFields ?? []; a.UpdatedAt = DateTime.UtcNow;
            _history[id].Add(new(DateTime.UtcNow, "Updated", "Account details changed")); Persist(); error = null; return true;
        }
    }
    public bool SetStatus(Guid id, StatusRequest status, out string? error)
    {
        var a = Find(id); if (a is null) { error = "Account not found."; return false; }
        if (status.Status == AccountStatus.Inactive && _accounts.Any(x => x.ParentId == id && x.Status == AccountStatus.Active)) { error = "Deactivate active child accounts first."; return false; }
        a.Status = status.Status; a.UpdatedAt = DateTime.UtcNow; _history[id].Add(new(DateTime.UtcNow, status.Status.ToString(), status.Reason ?? "Status changed")); Persist(); error = null; return true;
    }
    public bool Delete(Guid id, out string? error)
    {
        var a = Find(id); if (a is null) { error = "Account not found."; return false; }
        if (_accounts.Any(x => x.ParentId == id) || _entries.Any(e => e.Lines.Any(l => l.AccountId == id))) { error = "Accounts with children or transactions cannot be deleted. Deactivate instead."; return false; }
        _accounts.Remove(a); _history.Remove(id); Persist(); error = null; return true;
    }
    public bool CreateJournal(JournalEntryRequest request, out JournalEntry? entry, out string? error)
    {
        entry = null; error = null;
        if (!ValidateJournal(request, out error)) return false;
        lock (_lock)
        {
            entry = new JournalEntry { Date = request.Date, Reference = request.Reference, Description = request.Description, Lines = request.Lines.Select(l => new JournalLine(l.AccountId, l.Debit, l.Credit, l.Memo, l.Comment, l.CurrencyCode, l.ExchangeRate, l.CompanyId)).ToList(), TransactionType = request.TransactionType, CurrencyCode = request.CurrencyCode, ExchangeRate = request.ExchangeRate, CompanyId = request.CompanyId, CounterpartyCompanyId = request.CounterpartyCompanyId, ReversalDate = request.ReversalDate, AutoReverse = request.AutoReverse };
            _entries.Add(entry); AddEvent(entry, "on_create", "system", "Journal entry created as draft"); Persist(); return true;
        }
    }
    public bool Transition(Guid id, JournalStatus target, TransitionRequest request, out JournalEntry? entry, out string? error)
    {
        lock (_lock)
        {
            entry = FindEntry(id); error = null;
            if (entry is null) { error = "Journal entry not found."; return false; }
            if (entry.Version != request.Version) { error = "This journal has changed. Refresh and try again."; return false; }
            var valid = (entry.Status, target) switch { (JournalStatus.Draft, JournalStatus.Submitted) => true, (JournalStatus.Submitted, JournalStatus.Approved) => true, (JournalStatus.Approved, JournalStatus.Posted) => true, _ => false };
            if (!valid) { error = $"Cannot change a {entry.Status} entry to {target}."; return false; }
            entry.Status = target; entry.Version++;
            var eventType = target == JournalStatus.Submitted ? "on_submit" : target == JournalStatus.Approved ? "on_approve" : "on_post";
            AddEvent(entry, eventType, "system", request.Note ?? $"Journal entry {target.ToString().ToLowerInvariant()}");
            if (target == JournalStatus.Posted && (entry.AutoReverse || entry.ReversalDate.HasValue)) CreateReversal(entry);
            Persist();
            return true;
        }
    }
    public bool BatchPost(BatchPostRequest request, out object result, out string? error)
    {
        lock (_lock)
        {
            if (request.EntryIds.Count == 0 || request.EntryIds.Count > 1000) { result = new { }; error = "Batch size must be between 1 and 1000 entries."; return false; }
            var selected = request.EntryIds.Select(FindEntry).ToList();
            if (selected.Any(x => x is null || x.Status != JournalStatus.Approved)) { result = new { }; error = "All batch entries must exist and be approved."; return false; }
            foreach (var item in selected!) { item!.Status = JournalStatus.Posted; item.Version++; AddEvent(item, "on_post", "system", "Posted by batch"); if (item.AutoReverse || item.ReversalDate.HasValue) CreateReversal(item); }
            Persist(); result = new { posted = selected.Count }; error = null; return true;
        }
    }
    public JournalEntry? FindEntry(Guid id) => _entries.FirstOrDefault(x => x.Id == id);
    public IEnumerable<JournalEvent> Events(Guid id) => _journalEvents.Where(x => x.JournalEntryId == id).OrderByDescending(x => x.OccurredAt);
    public void AddAttachment(Guid id, AttachmentRequest attachment) { var entry = FindEntry(id) ?? throw new KeyNotFoundException(); entry.Attachments.Add(new Attachment(attachment.FileName, attachment.ContentType, attachment.Url, DateTime.UtcNow)); AddEvent(entry, "attachment_added", "system", attachment.FileName); Persist(); }
    public RecurringJournalEntry AddRecurring(RecurringEntryRequest request) { if (!ValidateJournal(request.Entry, out var error)) throw new InvalidOperationException(error); var recurring = new RecurringJournalEntry { Entry = request.Entry, Frequency = request.Frequency, StartsOn = request.StartsOn, EndsOn = request.EndsOn }; _recurringEntries.Add(recurring); Persist(); return recurring; }
    public JournalTemplate AddTemplate(JournalTemplateRequest request) { var template = new JournalTemplate { Name = request.Name, Description = request.Description, TransactionType = request.TransactionType, CurrencyCode = request.CurrencyCode, Lines = request.Lines }; _templates.Add(template); Persist(); return template; }
    public bool CreateIntercompanyAllocation(IntercompanyAllocationRequest request, out IntercompanyAllocation? allocation, out string? error)
    {
        allocation = null; error = null;
        if (string.IsNullOrWhiteSpace(request.Name) || request.SourceCompanyId == Guid.Empty || string.IsNullOrWhiteSpace(request.Category)) { error = "Name, source company, and category are required."; return false; }
        if (request.Rate < 0 || request.Quantity <= 0) { error = "Rate must be zero or greater and quantity must be greater than zero."; return false; }
        if (request.EndDate is { } end && end < request.StartDate) { error = "End date cannot be before start date."; return false; }
        if (!_companies.Any(x => x.Id == request.SourceCompanyId && x.Active)) { error = "Select an active source company."; return false; }
        if (request.Recipients.Count == 0 || request.Recipients.Any(x => x.CompanyId == Guid.Empty || x.SharePercent <= 0 || x.CompanyId == request.SourceCompanyId || !_companies.Any(c => c.Id == x.CompanyId && c.Active))) { error = "Recipients must be active companies and cannot be the source company."; return false; }
        if (Math.Abs(request.Recipients.Sum(x => x.SharePercent) - 100m) > .01m) { error = "Recipient shares must total 100%."; return false; }
        allocation = new IntercompanyAllocation { Name = request.Name.Trim(), SourceCompanyId = request.SourceCompanyId, Category = request.Category.Trim(), Description = request.Description?.Trim(), Frequency = request.Frequency, Rate = request.Rate, Quantity = request.Quantity, StartDate = request.StartDate, EndDate = request.EndDate, Recipients = request.Recipients };
        _intercompanyAllocations.Add(allocation); Persist(); return true;
    }
    public bool SetIntercompanyStatus(Guid id, IntercompanyAllocationStatus status, out string? error)
    {
        var allocation = _intercompanyAllocations.FirstOrDefault(x => x.Id == id);
        if (allocation is null) { error = "Intercompany allocation not found."; return false; }
        allocation.Status = status; allocation.UpdatedAt = DateTime.UtcNow; Persist(); error = null; return true;
    }
    private bool ValidateJournal(JournalEntryRequest request, out string? error)
    {
        error = null;
        if (request.Lines.Count < 2) { error = "A journal entry requires at least two lines."; return false; }
        if (request.Lines.Any(l => l.Debit < 0 || l.Credit < 0 || (l.Debit == 0 && l.Credit == 0) || (l.Debit > 0 && l.Credit > 0))) { error = "Each line needs a non-zero debit or credit, not both."; return false; }
        if (Math.Abs(request.Lines.Sum(l => l.Debit) - request.Lines.Sum(l => l.Credit)) > .001m) { error = "Debits must equal credits within 0.001."; return false; }
        if (request.ExchangeRate <= 0 || request.ExchangeRate < .5m || request.ExchangeRate > 1.5m) { error = "Exchange rate must be within ±50% of the current reference rate."; return false; }
        if (request.Date.Year != DateTime.UtcNow.Year) { error = "The selected accounting period is closed."; return false; }
        if (request.Lines.Any(l => Find(l.AccountId)?.Status != AccountStatus.Active)) { error = "All selected accounts must be active."; return false; }
        if (request.TransactionType == TransactionType.InterCompany && (!request.CompanyId.HasValue || !request.CounterpartyCompanyId.HasValue || request.CompanyId == request.CounterpartyCompanyId)) { error = "Inter-company entries need two distinct companies."; return false; }
        return true;
    }
    private void AddEvent(JournalEntry entry, string eventType, string actor, string detail) => _journalEvents.Add(new JournalEvent(Guid.NewGuid(), entry.Id, eventType, DateTime.UtcNow, actor, detail, entry.Version));
    private void CreateReversal(JournalEntry original)
    {
        if (!original.ReversalDate.HasValue || _entries.Any(x => x.ReversalOfId == original.Id)) return;
        var reversal = new JournalEntry { Date = original.ReversalDate.Value, Reference = $"REV-{original.Reference}", Description = $"Reversal: {original.Description}", Lines = original.Lines.Select(l => new JournalLine(l.AccountId, l.Credit, l.Debit, l.Memo, l.Comment, l.CurrencyCode, l.ExchangeRate, l.CompanyId)).ToList(), TransactionType = TransactionType.Adjustment, CurrencyCode = original.CurrencyCode, ExchangeRate = original.ExchangeRate, CompanyId = original.CompanyId, ReversalOfId = original.Id, Status = JournalStatus.Draft };
        _entries.Add(reversal); AddEvent(reversal, "on_reverse", "system", $"Created from {original.Reference}");
    }
    private bool LoadState()
    {
        if (_dbFactory is null) return false;
        using var db = _dbFactory.CreateDbContext();
        db.Database.EnsureCreated();
        var snapshot = db.AccountingStateSnapshots.Find(1);
        if (snapshot is null) return false;
        var state = JsonSerializer.Deserialize<StoredState>(snapshot.Json);
        if (state is null) return false;
        _accounts.AddRange(state.Accounts); _entries.AddRange(state.Entries); _templates.AddRange(state.Templates); _recurringEntries.AddRange(state.RecurringEntries); _journalEvents.AddRange(state.Events); _intercompanyAllocations.AddRange(state.IntercompanyAllocations ?? []); _companies.AddRange(state.Companies ?? [new Company { Name = "Acme Holdings", Code = "ACME", Type = EntityType.Parent }, new Company { Name = "Acme Services", Code = "ASV" }, new Company { Name = "Acme Trading", Code = "ATD" }]);
        foreach (var (id, history) in state.History) _history[id] = history;
        return true;
    }
    private void Persist()
    {
        if (_dbFactory is null) return;
        using var db = _dbFactory.CreateDbContext();
        var json = JsonSerializer.Serialize(new StoredState(_accounts, _entries, _history, _templates, _recurringEntries, _journalEvents, _intercompanyAllocations, _companies));
        var snapshot = db.AccountingStateSnapshots.Find(1);
        if (snapshot is null) db.AccountingStateSnapshots.Add(new AccountingStateSnapshot { Id = 1, Json = json, UpdatedAt = DateTime.UtcNow });
        else { snapshot.Json = json; snapshot.UpdatedAt = DateTime.UtcNow; }
        db.SaveChanges();
    }
    private void Validate(AccountRequest r, Guid? editing)
    {
        if (string.IsNullOrWhiteSpace(r.Name)) throw new InvalidOperationException("Account name is required.");
        if (!string.IsNullOrWhiteSpace(r.Code) && _accounts.Any(a => a.Id != editing && a.Code.Equals(r.Code.Trim(), StringComparison.OrdinalIgnoreCase))) throw new InvalidOperationException("Account code already exists.");
        if (r.CustomFields?.Count > 20) throw new InvalidOperationException("A maximum of 20 custom fields is allowed.");
        if (r.ParentId is { } parent)
        {
            if (parent == editing) throw new InvalidOperationException("An account cannot be its own parent.");
            var current = Find(parent); var level = 1;
            while (current?.ParentId is { } pid) { if (pid == editing) throw new InvalidOperationException("A parent cannot be a descendant of this account."); current = Find(pid); level++; }
            if (level >= 10) throw new InvalidOperationException("The hierarchy is limited to 10 levels.");
        }
    }
}
