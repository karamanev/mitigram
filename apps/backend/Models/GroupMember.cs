namespace MitigramApi.Models;

public class GroupMember
{
    public string ContactId { get; set; } = string.Empty;
    public Contact Contact { get; set; } = null!;
    public string GroupId { get; set; } = string.Empty;
    public Group Group { get; set; } = null!;
}
