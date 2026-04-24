namespace MitigramApi.Dtos;

public record InvitationResponseDto(
    string Id,
    string InstrumentId,
    string[] Emails,
    DateTime SentAt);
