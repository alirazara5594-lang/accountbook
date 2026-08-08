using Microsoft.EntityFrameworkCore;

namespace Zenabook.Api.Data;

public class AccountingDbContext(DbContextOptions<AccountingDbContext> options) : DbContext(options)
{
    public DbSet<AccountingStateSnapshot> AccountingStateSnapshots => Set<AccountingStateSnapshot>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AccountingStateSnapshot>(entity =>
        {
            entity.ToTable("accounting_state_snapshots");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Json).HasColumnType("jsonb");
        });
    }
}

public class AccountingStateSnapshot
{
    public int Id { get; set; }
    public required string Json { get; set; }
    public DateTime UpdatedAt { get; set; }
}
