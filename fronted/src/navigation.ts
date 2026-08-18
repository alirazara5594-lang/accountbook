import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Landmark,
  BookOpen,
  Boxes,
  Factory,
  Users,
  MapPin,
  Scale,
  Briefcase,
  Sparkles,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavGroup {
  name: string;
  icon: LucideIcon;
  short: string;
  items: string[];
  moduleId: string;
}

export const NAVIGATION: NavGroup[] = [
  { name: 'Overview', icon: LayoutDashboard, short: 'Home', items: [], moduleId: 'overview' },
  { name: 'Sales & Customers', icon: ShoppingCart, short: 'Sales', items: ['Customers', 'Products & Services', 'Sales Workspace', 'Estimates & Quotes', 'Sales Orders', 'Credit Notes', 'Customer Payments', 'Customer Statements', 'Customer Aging', 'Sales Reports'], moduleId: 'sales' },
  { name: 'Procurement', icon: ShoppingBag, short: 'Buy', items: ['Vendors', 'Procurement Workspace', 'Bills', 'Debit Notes', 'Expense Claims', 'Vendor Payments', 'Vendor Statements', 'Payables Aging', 'Purchase Reports'], moduleId: 'procurement' },
  { name: 'Banking & Payments', icon: Landmark, short: 'Bank', items: ['Bank Accounts', 'Cash Accounts', 'Bank Connection', 'Bank Import', 'Transactions', 'Bank Reconciliation', 'Voucher Management', 'Fund Transfers', 'Cash Flow Statements'], moduleId: 'banking' },
  { name: 'Accounting', icon: BookOpen, short: 'Books', items: ['Chart of Accounts', 'Journal Entries', 'Fixed Assets', 'General Ledger', 'Accounts Receivable', 'Accounts Payable', 'Budgets', 'Financial Reports', 'Period Closing', 'Audit Trail', 'Intercompany Allocations', 'Lease Accounting'], moduleId: 'accounting' },
  { name: 'Assets & Inventory', icon: Boxes, short: 'Assets', items: ['Assets & Inventory Workspace', 'Depreciation Run', 'Depreciation Schedule', 'Valuation Reports'], moduleId: 'assets' },
  { name: 'Manufacturing & Production', icon: Factory, short: 'Factory', items: ['Manufacturing Workspace', 'Bill of Materials', 'Work Orders', 'Job Costing'], moduleId: 'manufacturing' },
  { name: 'Payroll & HR', icon: Users, short: 'People', items: ['Employees', 'Attendance', 'Leave', 'Payroll', 'Salary', 'Loans & Advances', 'HR Reports'], moduleId: 'payroll' },
  { name: 'Survey & Field Operations', icon: MapPin, short: 'Field', items: ['Surveys', 'Field Visits', 'Inspections', 'Work Orders', 'Field Expenses', 'Field Reports'], moduleId: 'field' },
  { name: 'Government Compliance', icon: Scale, short: 'Tax', items: ['Tax Management', 'VAT / Sales Tax', 'Withholding Tax', 'Tax Returns', 'E-Invoicing', 'Compliance Reports'], moduleId: 'compliance' },
  { name: 'Projects', icon: Briefcase, short: 'Projects', items: ['Projects', 'Project Planning', 'Tasks', 'Project Budget', 'Project Costing', 'Timesheets', 'Project Billing', 'Project Expenses', 'Project Profitability', 'Reports'], moduleId: 'projects' },
  { name: 'AI & Analytics', icon: Sparkles, short: 'Insights', items: ['Analytics Dashboard', 'Financial Analytics', 'Sales Analytics', 'Expense Analytics', 'Cash Flow Analytics', 'Inventory Analytics', 'Forecasting', 'AI Insights'], moduleId: 'analytics' },
  { name: 'Administration', icon: Settings, short: 'Admin', items: ['Users', 'Roles & Permissions', 'Companies', 'Branches', 'Approval Workflows', 'System Settings', 'Chart of Accounts Mapping', 'Number Series', 'Currency', 'Tax Accounting', 'Audit Logs'], moduleId: 'administration' }
];