using System;
using System.Collections.Generic;

namespace Zenabook.Api.Models
{
    public enum UserStatus
    {
        Active = 0,
        Inactive = 1,
        Locked = 2
    }

    public class AdminUser
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string UserName { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Role { get; set; } = "Viewer";
        public UserStatus Status { get; set; } = UserStatus.Active;
        public DateTime? LastLogin { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record AdminUserRequest(
        string UserName, string FullName, string Email, string Role, UserStatus Status, Guid? CompanyId
    );

    public class UserRole
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public List<string> Permissions { get; set; } = [];
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record UserRoleRequest(
        string Name, string Description, List<string>? Permissions, Guid? CompanyId
    );

    public class Branch
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string Name { get; set; } = "";
        public string Code { get; set; } = "";
        public string City { get; set; } = "";
        public string Address { get; set; } = "";
        public bool Active { get; set; } = true;
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record BranchRequest(
        string Name, string Code, string City, string Address, bool Active, Guid? CompanyId
    );

    public class ApprovalWorkflow
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string Name { get; set; } = "";
        public string Module { get; set; } = "Sales";
        public string ApproverRole { get; set; } = "Manager";
        public int Steps { get; set; } = 1;
        public bool Active { get; set; } = true;
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record ApprovalWorkflowRequest(
        string Name, string Module, string ApproverRole, int Steps, bool Active, Guid? CompanyId
    );

    public class NumberSeries
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string Name { get; set; } = "";
        public string Prefix { get; set; } = "";
        public int NextNumber { get; set; } = 1;
        public string Format { get; set; } = "";
        public bool Active { get; set; } = true;
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record NumberSeriesRequest(
        string Name, string Prefix, int NextNumber, string Format, bool Active, Guid? CompanyId
    );

    public class Currency
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string Code { get; set; } = "";
        public string Name { get; set; } = "";
        public string Symbol { get; set; } = "";
        public decimal Rate { get; set; } = 1m;
        public bool Base { get; set; }
        public bool Active { get; set; } = true;
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record CurrencyRequest(
        string Code, string Name, string Symbol, decimal Rate, bool Base, bool Active, Guid? CompanyId
    );
}
