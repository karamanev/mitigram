using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MitigramApi.Data;
using Xunit;

namespace MitigramApi.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath =
        Path.Combine(Path.GetTempPath(), $"mitigram-test-{Guid.NewGuid()}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var existing = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (existing != null) services.Remove(existing);

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite($"Data Source={_dbPath}"));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (!File.Exists(_dbPath))
        {
            return;
        }

        try
        {
            File.Delete(_dbPath);
        }
        catch (IOException)
        {
            // The test host can still be releasing the SQLite file during disposal.
        }
        catch (UnauthorizedAccessException)
        {
            // Best-effort cleanup only; a temp DB file is acceptable if the host still holds a lock.
        }
    }
}

public class ApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public ApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ── GET /api/contacts ────────────────────────────────────────────────────

    [Fact]
    public async Task GetContacts_Returns200()
    {
        var response = await _client.GetAsync("/api/contacts");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetContacts_ReturnsSeedData()
    {
        var contacts = await _client.GetFromJsonAsync<JsonElement[]>("/api/contacts", JsonOpts);
        Assert.NotNull(contacts);
        Assert.NotEmpty(contacts);
    }

    [Fact]
    public async Task GetContacts_HasCorrectShape()
    {
        var contacts = await _client.GetFromJsonAsync<JsonElement[]>("/api/contacts", JsonOpts);
        Assert.NotNull(contacts);
        var first = contacts[0];
        Assert.True(first.TryGetProperty("id", out _), "missing id");
        Assert.True(first.TryGetProperty("name", out _), "missing name");
        Assert.True(first.TryGetProperty("email", out _), "missing email");
    }

    [Fact]
    public async Task GetContacts_SortedByName()
    {
        var contacts = await _client.GetFromJsonAsync<JsonElement[]>("/api/contacts", JsonOpts);
        Assert.NotNull(contacts);
        var names = contacts.Select(c => c.GetProperty("name").GetString()!).ToList();
        Assert.Equal(names.OrderBy(n => n), names);
    }

    // ── GET /api/groups ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetGroups_Returns200()
    {
        var response = await _client.GetAsync("/api/groups");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetGroups_ReturnsSeedData()
    {
        var groups = await _client.GetFromJsonAsync<JsonElement[]>("/api/groups", JsonOpts);
        Assert.NotNull(groups);
        Assert.NotEmpty(groups);
    }

    [Fact]
    public async Task GetGroups_HasCorrectShape()
    {
        var groups = await _client.GetFromJsonAsync<JsonElement[]>("/api/groups", JsonOpts);
        Assert.NotNull(groups);
        var first = groups[0];
        Assert.True(first.TryGetProperty("id", out _), "missing id");
        Assert.True(first.TryGetProperty("name", out _), "missing name");
        Assert.True(first.TryGetProperty("members", out var members), "missing members");
        Assert.Equal(JsonValueKind.Array, members.ValueKind);
    }

    [Fact]
    public async Task GetGroups_MembersHaveCorrectShape()
    {
        var groups = await _client.GetFromJsonAsync<JsonElement[]>("/api/groups", JsonOpts);
        Assert.NotNull(groups);
        var firstMember = groups
            .SelectMany(g => g.GetProperty("members").EnumerateArray())
            .First();
        Assert.True(firstMember.TryGetProperty("id", out _), "member missing id");
        Assert.True(firstMember.TryGetProperty("name", out _), "member missing name");
        Assert.True(firstMember.TryGetProperty("email", out _), "member missing email");
    }

    [Fact]
    public async Task GetGroups_SortedByName()
    {
        var groups = await _client.GetFromJsonAsync<JsonElement[]>("/api/groups", JsonOpts);
        Assert.NotNull(groups);
        var names = groups.Select(g => g.GetProperty("name").GetString()!).ToList();
        Assert.Equal(names.OrderBy(n => n), names);
    }

    // ── POST /api/instruments/:id/invitations ────────────────────────────────

    [Fact]
    public async Task CreateInvitation_ValidPayload_Returns201()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/instruments/inst-create-201/invitations",
            new { emails = new[] { "alice@example.com" } });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateInvitation_ValidPayload_ReturnsCorrectShape()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/instruments/inst-create-shape/invitations",
            new { emails = new[] { "alice@example.com", "bob@example.com" } });

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        Assert.True(body.TryGetProperty("id", out _), "missing id");
        Assert.True(body.TryGetProperty("instrumentId", out var instrId), "missing instrumentId");
        Assert.Equal("inst-create-shape", instrId.GetString());
        Assert.True(body.TryGetProperty("emails", out var emails), "missing emails");
        Assert.Equal(2, emails.GetArrayLength());
        Assert.True(body.TryGetProperty("sentAt", out _), "missing sentAt");
    }

    [Fact]
    public async Task CreateInvitation_MultipleEmails_PersistsAll()
    {
        var payload = new[] { "a@test.com", "b@test.com", "c@test.com" };
        var response = await _client.PostAsJsonAsync(
            "/api/instruments/inst-2/invitations",
            new { emails = payload });

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        var returned = body.GetProperty("emails").EnumerateArray()
            .Select(e => e.GetString()!)
            .ToArray();

        Assert.Equal(payload.OrderBy(x => x), returned.OrderBy(x => x));
    }

    [Fact]
    public async Task CreateInvitation_AlreadyInvitedEmail_Returns409WithAlertPayload()
    {
        await _client.PostAsJsonAsync(
            "/api/instruments/inst-duplicate/invitations",
            new { emails = new[] { "alice@example.com" } });

        var response = await _client.PostAsJsonAsync(
            "/api/instruments/inst-duplicate/invitations",
            new { emails = new[] { "alice@example.com" } });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        Assert.Equal(
            "The recipient alice@example.com was already invited.",
            body.GetProperty("message").GetString());

        var duplicates = body.GetProperty("alreadyInvitedEmails")
            .EnumerateArray()
            .Select(item => item.GetString())
            .ToArray();

        Assert.Equal(new[] { "alice@example.com" }, duplicates);
    }

    [Fact]
    public async Task CreateInvitation_AlreadyInvitedForDifferentInstrument_IsAllowed()
    {
        await _client.PostAsJsonAsync(
            "/api/instruments/inst-a/invitations",
            new { emails = new[] { "alice@example.com" } });

        var response = await _client.PostAsJsonAsync(
            "/api/instruments/inst-b/invitations",
            new { emails = new[] { "alice@example.com" } });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateInvitation_DeduplicatesEmailsWithinTheSameRequest()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/instruments/inst-dedupe/invitations",
            new { emails = new[] { "alice@example.com", "ALICE@example.com", "alice@example.com" } });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        Assert.Equal(1, body.GetProperty("emails").GetArrayLength());
    }

    [Fact]
    public async Task CreateInvitation_EmptyEmailsArray_Returns400()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/instruments/inst-empty/invitations",
            new { emails = Array.Empty<string>() });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateInvitation_InvalidEmail_Returns400()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/instruments/inst-invalid/invitations",
            new { emails = new[] { "not-an-email" } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateInvitation_MissingBody_Returns400()
    {
        var response = await _client.PostAsync(
            "/api/instruments/inst-missing-body/invitations",
            new StringContent("", System.Text.Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
