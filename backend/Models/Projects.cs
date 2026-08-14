using System;

namespace Zenabook.Api.Models
{
    public enum ProjectStatus
    {
        Planning = 0,
        Active = 1,
        OnHold = 2,
        Completed = 3,
        Cancelled = 4
    }

    public enum ProjectTaskStatus
    {
        NotStarted = 0,
        InProgress = 1,
        Blocked = 2,
        Completed = 3,
        Cancelled = 4
    }

    public enum TaskPriority
    {
        Low = 0,
        Medium = 1,
        High = 2,
        Critical = 3
    }

    public class Project
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public string ProjectNumber { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
        public DateOnly StartDate { get; set; } = DateOnly.FromDateTime(DateTime.Today);
        public DateOnly? EndDate { get; set; }
        public Guid? ManagerId { get; set; }
        public Guid? DepartmentId { get; set; }
        public Guid? CustomerId { get; set; }
        public string CustomerName { get; set; } = "";
        public decimal Budget { get; set; }
        public string Currency { get; set; } = "USD";
        public decimal ProgressPercent { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public record ProjectRequest(
        string Name, string Description, ProjectStatus Status, DateOnly StartDate,
        DateOnly? EndDate, Guid? ManagerId, Guid? DepartmentId, Guid? CustomerId,
        string CustomerName, decimal Budget, string Currency, Guid? CompanyId
    );

    public class ProjectPhase
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public int OrderIndex { get; set; }
        public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.NotStarted;
    }

    public record ProjectPhaseRequest(Guid ProjectId, string Name, string Description, int OrderIndex);

    public class ProjectTask
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public Guid ProjectId { get; set; }
        public Guid? PhaseId { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public Guid? AssigneeId { get; set; }
        public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.NotStarted;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        public DateOnly StartDate { get; set; } = DateOnly.FromDateTime(DateTime.Today);
        public DateOnly? DueDate { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal ActualHours { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public record ProjectTaskRequest(
        Guid ProjectId, Guid? PhaseId, string Title, string Description, Guid? AssigneeId,
        ProjectTaskStatus Status, TaskPriority Priority, DateOnly StartDate, DateOnly? DueDate,
        decimal EstimatedHours, Guid? CompanyId
    );

    public class TimesheetEntry
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public Guid ProjectId { get; set; }
        public Guid? TaskId { get; set; }
        public Guid EmployeeId { get; set; }
        public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.Today);
        public decimal Hours { get; set; }
        public string Description { get; set; } = "";
        public bool Billable { get; set; }
        public decimal BillableRate { get; set; }
        public string Currency { get; set; } = "USD";
        public bool Approved { get; set; }
        public Guid? ApprovedBy { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record TimesheetRequest(
        Guid ProjectId, Guid? TaskId, Guid EmployeeId, DateOnly Date, decimal Hours,
        string Description, bool Billable, decimal BillableRate, string Currency, Guid? CompanyId
    );

    public class ProjectExpense
    {
        public Guid Id { get; init; } = Guid.NewGuid();
        public Guid ProjectId { get; set; }
        public Guid? EmployeeId { get; set; }
        public string Category { get; set; } = "";
        public string Description { get; set; } = "";
        public string? VendorName { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public DateOnly ExpenseDate { get; set; } = DateOnly.FromDateTime(DateTime.Today);
        public bool Billable { get; set; } = true;
        public bool Reimbursed { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    }

    public record ProjectExpenseRequest(
        Guid ProjectId, Guid? EmployeeId, string Category, string Description, string? VendorName,
        decimal Amount, string Currency, DateOnly ExpenseDate, bool Billable, Guid? CompanyId
    );
}
