# Accounting Standards Rule

When developing features, data models, logic, or UI for this Account Book / ERP application, you MUST strictly adhere to:
1. **IAS (International Accounting Standards) / IFRS**
2. **GAAP (Generally Accepted Accounting Principles)**

## Key Principles to Enforce:
- **Double-Entry Bookkeeping:** Every transaction must have equal debit and credit entries.
- **Accrual Basis Accounting:** Revenues and expenses should be recorded when they occur, not necessarily when cash changes hands.
- **Matching Principle:** Expenses must be reported in the same period as the revenues they help to generate.
- **Audit Trails:** All financial records must be immutable (no hard deletes) and have a comprehensive audit trail tracing changes and actors.
- **Chart of Accounts:** Ensure proper categorization (Asset, Liability, Equity, Revenue, Expense) consistent with standard reporting requirements.
- **Financial Reporting:** Any reports (Balance Sheet, Income Statement, Cash Flow) generated must format and group data according to international compliance standards.

Always double-check your code logic (especially around Journals, Invoices, and Taxes) against these principles. If a user request contradicts GAAP or IAS, warn the user and suggest the compliant approach.

# Multi-Sector Adaptability Rule

This ERP software MUST be designed to accommodate **ALL types of business sectors** simultaneously, including but not limited to:
- **Services** (e.g., hourly billing, service items, retainers, consulting)
- **Retail / E-commerce** (e.g., physical inventory, POS integrations, barcoding, shipping)
- **Construction / Manufacturing** (e.g., project-based accounting, job costing, raw materials, progress billing)

## Key Principles to Enforce:
- **Flexible Data Models:** Products/Services must support types like `Physical Product`, `Service`, `Non-Inventory`, and `Bundle`.
- **Dynamic Workflows:** Ensure features like Job Costing or Warehouse Management do not break or unnecessarily complicate simple service-based workflows. The system should scale flexibly depending on what features a sector requires.
- **Universal Terminology (where possible):** Use industry-agnostic terms where appropriate or allow settings to define the business context.

# Global Market & Localization Rule

This ERP software MUST be globally compliant, explicitly targeting the following markets: **UK, Europe, Canada, USA, UAE, Saudi Arabia (KSA), and Pakistan**.

## Key Principles to Enforce:
- **Global Tax Engine:** Assume all transactions (Sales, Purchases, Expenses) require robust Tax Codes, Tax Rates, and Tax Groupings to support VAT (UK/EU/UAE/KSA/PK), Sales Tax (US), and GST/HST/PST (Canada). Do NOT hardcode flat tax percentages.
- **Multi-Currency:** Ensure all financial transactions record both the base currency and the foreign transaction currency. Calculate and record Realized/Unrealized FX Gains/Losses.
- **Localization:** Support dynamic Date formatting, Number formatting, and multi-language capability (including RTL Arabic for UAE/KSA).
- **E-Invoicing & Compliance:** When building Invoicing modules, ensure the architecture supports real-time clearance/e-invoicing integrations (e.g., ZATCA in KSA, FBR in Pakistan, EU e-invoicing).
