using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MitigramApi.Models;

namespace MitigramApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<Invitation> Invitations => Set<Invitation>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<GroupMember>().HasKey(gm => new { gm.ContactId, gm.GroupId });

        mb.Entity<GroupMember>()
            .HasOne(gm => gm.Contact)
            .WithMany(c => c.Groups)
            .HasForeignKey(gm => gm.ContactId);

        mb.Entity<GroupMember>()
            .HasOne(gm => gm.Group)
            .WithMany(g => g.Members)
            .HasForeignKey(gm => gm.GroupId);

        // Stores string[] as a JSON string in the SQLite TEXT column.
        mb.Entity<Invitation>()
            .Property(i => i.Emails)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions?)null) ?? Array.Empty<string>());
    }
}
