# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY apps/backend/MitigramApi.csproj ./
RUN dotnet restore
COPY apps/backend/ ./
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish ./
EXPOSE 3000
ENV ASPNETCORE_HTTP_PORTS=3000
ENTRYPOINT ["dotnet", "MitigramApi.dll"]
