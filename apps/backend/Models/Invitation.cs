namespace MitigramApi.Models;

public class Invitation
{
    public string Id { get; set; } = string.Empty;
    public string InstrumentId { get; set; } = string.Empty;
    public string[] Emails { get; set; } = [];
    public DateTime SentAt { get; set; }
}
