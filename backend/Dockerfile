# Dockerfile for ASP.NET Core Web API (Zenabook.Api)

# Step 1: Build application
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["Zenabook.Api.csproj", "./"]
RUN dotnet restore "Zenabook.Api.csproj"

# Copy remaining source code and publish
COPY . .
RUN dotnet publish "Zenabook.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Step 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Accountbook.Api.dll"]

