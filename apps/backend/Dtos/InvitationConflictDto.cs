namespace MitigramApi.Dtos;

public record InvitationConflictDto(
    string Message,
    string[] AlreadyInvitedEmails);
