using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MitigramApi.Data;
using MitigramApi.Dtos;
using MitigramApi.Models;

namespace MitigramApi.Controllers;

[ApiController]
[Route("api/instruments")]
public class InvitationsController(AppDbContext db) : ControllerBase
{
    [HttpPost("{instrumentId}/invitations")]
    public async Task<IActionResult> Create(string instrumentId, [FromBody] CreateInvitationDto dto)
    {
        var requestedEmails = dto.Emails
            .Select(email => email.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var alreadyInvitedEmails = (await db.Invitations
                .Where(invitation => invitation.InstrumentId == instrumentId)
                .Select(invitation => invitation.Emails)
                .ToListAsync())
            .SelectMany(emails => emails)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Intersect(requestedEmails, StringComparer.OrdinalIgnoreCase)
            .OrderBy(email => email, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (alreadyInvitedEmails.Length > 0)
        {
            return Conflict(new InvitationConflictDto(
                alreadyInvitedEmails.Length == 1
                    ? $"The recipient {alreadyInvitedEmails[0]} was already invited."
                    : $"Some recipients were already invited: {string.Join(", ", alreadyInvitedEmails)}.",
                alreadyInvitedEmails));
        }

        var invitation = new Invitation
        {
            Id = Guid.NewGuid().ToString(),
            InstrumentId = instrumentId,
            Emails = requestedEmails,
            SentAt = DateTime.UtcNow,
        };

        db.Invitations.Add(invitation);
        await db.SaveChangesAsync();

        return StatusCode(201, new InvitationResponseDto(
            invitation.Id,
            invitation.InstrumentId,
            invitation.Emails,
            invitation.SentAt));
    }
}
