namespace MitigramApi.Dtos;

public record GroupMemberDto(string Id, string Name, string Email);

public record GroupDto(string Id, string Name, IEnumerable<GroupMemberDto> Members);
