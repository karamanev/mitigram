namespace MitigramApi.Models;

public class Group
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ICollection<GroupMember> Members { get; set; } = [];
}
