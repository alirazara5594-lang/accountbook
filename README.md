# Accountbook

## Install dependencies

Run this once after cloning the project:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup.ps1
```

For production-only frontend dependencies:

```powershell
.\setup.ps1 -Production
```

## Run locally

## Configure PostgreSQL persistence

In pgAdmin's Query Tool, while connected to the `postgres` database, create the application database once:

```sql
CREATE DATABASE accountbook;
```

Store your local database password securely (do not add it to `appsettings.json` or Git):

```powershell
cd backend
dotnet user-secrets set "ConnectionStrings:Postgres" "Host=localhost;Port=5432;Database=accountbook;Username=postgres;Password=YOUR_POSTGRES_PASSWORD;SSL Mode=Prefer"
```

On the next backend start, Accountbook creates its persistence table and stores accounts, journals, history, templates, recurring entries, and attachments in PostgreSQL. Without this setting it runs in temporary in-memory mode.

## Run locally

```powershell
cd backend
dotnet run --launch-profile http
```

In a second terminal:

```powershell
cd fronted
cmd /c npm run dev
```
