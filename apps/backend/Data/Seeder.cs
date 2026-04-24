using Microsoft.EntityFrameworkCore;
using MitigramApi.Models;

namespace MitigramApi.Data;

public static class Seeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Contacts.AnyAsync()) return;

        var contacts = new List<Contact>
        {
            new() { Id = "contact_alice",   Name = "Alice Schmidt",         Email = "alice.schmidt@deutsche-bank.example-bank.com" },
            new() { Id = "contact_bob",     Name = "Bob Müller",            Email = "bob.mueller@commerzbank.example-bank.com" },
            new() { Id = "contact_carol",   Name = "Carol Dubois",          Email = "carol.dubois@bnp-paribas.example-bank.com" },
            new() { Id = "contact_david",   Name = "David Fontaine",        Email = "david.fontaine@societe-generale.example-bank.com" },
            new() { Id = "contact_elena",   Name = "Ελένη Παπαδοπούλου",   Email = "elena.papadopoulou@eurobank.example-bank.com" },
            new() { Id = "contact_frank",   Name = "Frank van den Berg",    Email = "frank.vandenberg@ing.example-bank.com" },
            new() { Id = "contact_grace",   Name = "Grace O'Sullivan",      Email = "grace.osullivan@aib.example-bank.com" },
            new() { Id = "contact_hiro",    Name = "Hiroshi Tanaka",        Email = "h.tanaka@mizuho.example-bank.com" },
            new() { Id = "contact_ivan",    Name = "Ivan Petrov",           Email = "ivan.petrov@vtb.example-bank.com" },
            new() { Id = "contact_julia",   Name = "Julia Chen",            Email = "julia.chen+trade@icbc.example-bank.com" },
            new() { Id = "contact_kenji",   Name = "Kenji Nakamura",        Email = "kenji.nakamura@smbc.example-bank.com" },
            new() { Id = "contact_li",      Name = "Li Wei",                Email = "li.wei@boc.example-bank.com" },
            new() { Id = "contact_maria",   Name = "María José García",     Email = "maria.garcia@santander.example-bank.com" },
            new() { Id = "contact_nathan",  Name = "Nathan Brooks",         Email = "n.brooks@jpmorgan.example-bank.com" },
            new() { Id = "contact_olivia",  Name = "Olivia Washington",     Email = "olivia.washington@bankofamerica.example-bank.com" },
            new() { Id = "contact_pierre",  Name = "Pierre Lefevre",        Email = "pierre.lefevre@credit-agricole.example-bank.com" },
            new() { Id = "contact_quinn",   Name = "Quinn Fitzgerald",      Email = "q.fitzgerald@citibank.example-bank.com" },
            new() { Id = "contact_rafael",  Name = "Rafael Souza",          Email = "rafael.souza@itau.example-bank.com" },
            new() { Id = "contact_sara",    Name = "Sara Lindqvist",        Email = "sara.lindqvist@nordea.example-bank.com" },
            new() { Id = "contact_thomas",  Name = "Thomas Keller",         Email = "thomas.keller@ubs.demo-corp.eu" },
        };

        db.Contacts.AddRange(contacts);

        var groups = new[]
        {
            new
            {
                Id = "group_eu_banks", Name = "EU Banks",
                MemberIds = new[] { "contact_alice", "contact_bob", "contact_carol", "contact_david",
                                    "contact_elena", "contact_frank", "contact_grace", "contact_maria", "contact_pierre" },
            },
            new
            {
                Id = "group_asian_banks", Name = "Asian Banks",
                MemberIds = new[] { "contact_hiro", "contact_julia", "contact_kenji", "contact_li" },
            },
            new
            {
                Id = "group_us_banks", Name = "US Banks",
                MemberIds = new[] { "contact_nathan", "contact_olivia", "contact_quinn", "contact_rafael" },
            },
            new
            {
                // cross-cuts regional groups — drives dedup demo
                Id = "group_top_tier", Name = "Top Tier",
                MemberIds = new[] { "contact_alice", "contact_hiro", "contact_nathan", "contact_thomas" },
            },
            new
            {
                // overlaps EU Banks + Asian Banks — exercises exclusion
                Id = "group_favourites", Name = "Favourites",
                MemberIds = new[] { "contact_alice", "contact_julia", "contact_sara", "contact_ivan" },
            },
        };

        foreach (var g in groups)
        {
            db.Groups.Add(new Group { Id = g.Id, Name = g.Name });
            db.GroupMembers.AddRange(g.MemberIds.Select(cid => new GroupMember { GroupId = g.Id, ContactId = cid }));
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"Seeded {contacts.Count} contacts and {groups.Length} groups.");
    }
}
